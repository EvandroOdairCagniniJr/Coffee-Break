// Liberação da padaria, do lado de quem se cadastrou: ver a situação da análise, enviar os
// documentos pedidos e pedir nova análise depois de uma recusa. Funciona mesmo com a padaria
// ainda bloqueada (fica fora de exigirPadariaLiberada).
import { randomUUID } from 'node:crypto'
import express, { Router } from 'express'
import { z } from 'zod'
import type { RowDataPacket } from './db.ts'
import { pool } from './db.ts'
import type { Usuario } from './auth.ts'
import { esquecerTodos } from './cacheUsuarios.ts'
import { HttpError, validar } from './http.ts'

export const liberacaoRouter = Router()

export const LIMITE_DOCUMENTO = 3 * 1024 * 1024 // 3 MB por arquivo
export const MAXIMO_DOCUMENTOS = 10

// Tipo real do arquivo pelos primeiros bytes (não confia no nome nem no que o navegador diz).
export function tipoDoArquivo(b: Buffer): string | null {
  if (b.length >= 4 && b.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf'
  if (b.length >= 8 && b[0] === 0x89 && b.subarray(1, 4).toString('latin1') === 'PNG') return 'image/png'
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length >= 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP')
    return 'image/webp'
  return null
}

function nomeSeguro(nome: string) {
  const limpo = nome
    .normalize('NFC')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .trim()
    .slice(-160)
  return limpo || 'documento'
}

async function situacao(padariaId: string) {
  const [[padaria]] = await pool.query<RowDataPacket[]>(
    `select status, status_motivo, status_em, created_at, dados from padarias where id = ?`,
    [padariaId],
  )
  if (!padaria) throw new HttpError(404, 'Padaria não encontrada')
  return padaria
}

function exigirDono(u: Usuario) {
  if (u.papel !== 'dono') throw new HttpError(403, 'Só o dono da padaria envia os documentos.')
}

liberacaoRouter.get('/', async (_req, res) => {
  const u = res.locals.usuario as Usuario
  const padaria = await situacao(u.padaria_id)
  const [documentos] = await pool.query<RowDataPacket[]>(
    `select id, descricao, nome_arquivo, tipo, tamanho, created_at from padaria_documentos
     where padaria_id = ? order by created_at`,
    [u.padaria_id],
  )
  const [[contrato]] = await pool.query<RowDataPacket[]>(
    'select count(*)::int as n from assinaturas_contrato where padaria_id = ?',
    [u.padaria_id],
  )
  const dados = (padaria.dados ?? {}) as Record<string, unknown>
  res.json({
    status: padaria.status,
    motivo: padaria.status_motivo,
    status_em: padaria.status_em,
    cadastrada_em: padaria.created_at,
    padaria: {
      nome_fantasia: dados.nome_fantasia ?? null,
      razao_social: dados.razao_social ?? null,
      cnpj: dados.cnpj ?? null,
    },
    contrato_assinado: contrato.n > 0,
    documentos,
    limite_documentos: MAXIMO_DOCUMENTOS,
  })
})

// Arquivo em base64 no JSON: este caminho tem o próprio limite de tamanho (o geral é 1 MB).
liberacaoRouter.post('/documentos', express.json({ limit: '5mb', strict: true }), async (req, res) => {
  const u = res.locals.usuario as Usuario
  exigirDono(u)
  const corpo = validar(
    z.object({
      descricao: z.string().trim().min(2, 'Diga que documento é este').max(120),
      nome_arquivo: z.string().trim().min(1).max(300),
      conteudo: z.string().min(1, 'Arquivo vazio').max(5_000_000, 'Arquivo grande demais (até 3 MB)'),
    }),
    req.body,
  )
  const padaria = await situacao(u.padaria_id)
  if (padaria.status !== 'pendente' && padaria.status !== 'recusada') {
    throw new HttpError(409, 'Os documentos só podem ser enviados enquanto a padaria está em análise.')
  }
  const base64 = corpo.conteudo.replace(/^data:[^;,]+;base64,/, '')
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new HttpError(400, 'Arquivo inválido')
  const arquivo = Buffer.from(base64, 'base64')
  if (arquivo.length === 0) throw new HttpError(400, 'Arquivo vazio')
  if (arquivo.length > LIMITE_DOCUMENTO) throw new HttpError(413, 'Arquivo grande demais: envie até 3 MB.')
  const tipo = tipoDoArquivo(arquivo)
  if (!tipo) throw new HttpError(400, 'Envie o documento em PDF, JPG, PNG ou WEBP.')
  const [[contagem]] = await pool.query<RowDataPacket[]>(
    'select count(*)::int as n from padaria_documentos where padaria_id = ?',
    [u.padaria_id],
  )
  if (contagem.n >= MAXIMO_DOCUMENTOS) {
    throw new HttpError(409, `Limite de ${MAXIMO_DOCUMENTOS} documentos. Apague um para enviar outro.`)
  }
  const id = randomUUID()
  await pool.query(
    `insert into padaria_documentos (id, padaria_id, enviado_por, descricao, nome_arquivo, tipo, tamanho, conteudo)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, u.padaria_id, u.id, corpo.descricao, nomeSeguro(corpo.nome_arquivo), tipo, arquivo.length, arquivo],
  )
  res.status(201).json({ id, tipo, tamanho: arquivo.length })
})

liberacaoRouter.delete('/documentos/:id', async (req, res) => {
  const u = res.locals.usuario as Usuario
  exigirDono(u)
  const padaria = await situacao(u.padaria_id)
  if (padaria.status !== 'pendente' && padaria.status !== 'recusada') {
    throw new HttpError(409, 'Depois da liberação, os documentos ficam guardados para a análise.')
  }
  await pool.query('delete from padaria_documentos where id = ? and padaria_id = ?', [req.params.id, u.padaria_id])
  res.status(204).end()
})

// Depois de uma recusa: corrigiu o cadastro ou mandou o documento que faltava, pede de novo.
liberacaoRouter.post('/nova-analise', async (_req, res) => {
  const u = res.locals.usuario as Usuario
  exigirDono(u)
  const [r] = await pool.query<RowDataPacket[]>(
    `update padarias set status = 'pendente', status_em = now() where id = ? and status = 'recusada' returning id`,
    [u.padaria_id],
  )
  if (!r.length) throw new HttpError(409, 'Só dá para pedir nova análise depois de uma recusa.')
  esquecerTodos()
  res.status(204).end()
})
