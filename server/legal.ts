// Conformidade legal (LGPD, Marco Civil): versão dos Termos de Uso / Política de Privacidade,
// registro do aceite e o direito do titular de acessar e levar os próprios dados (LGPD, art. 18).
// Ao mudar os textos de forma relevante, troque VERSAO_TERMOS: todos aceitam de novo no próximo
// acesso. A mesma data fica em src/lib/empresa.ts (exibida nas páginas).
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { Router } from 'express'
import { z } from 'zod'
import type { RowDataPacket } from './db.ts'
import { pool } from './db.ts'
import type { Usuario } from './auth.ts'
import { esquecerUsuario } from './cacheUsuarios.ts'
import { HttpError, validar } from './http.ts'

export const VERSAO_TERMOS = '2026-11-03.4'

// Contrato de licença e prestação de serviços: o mesmo arquivo que o site mostra
// (src/features/legal/contrato.txt). O hash SHA-256 do texto vai junto com cada assinatura,
// provando exatamente o que foi assinado. Mudou o texto? Troque a versão no arquivo e aqui.
export const VERSAO_CONTRATO = '2026-11-03.3'
const TEXTO_CONTRATO = readFileSync(new URL('../src/features/legal/contrato.txt', import.meta.url), 'utf8')
  .replace(/\r\n/g, '\n')
  .trim()
export const HASH_CONTRATO = createHash('sha256').update(TEXTO_CONTRATO, 'utf8').digest('hex')

// Termos de Uso e Política de Privacidade: o texto sai das próprias páginas do site
// (TermosPage.tsx e PrivacidadePage.tsx), sem as marcações, com os dados da empresa no lugar.
const VALORES_EMPRESA = Object.fromEntries(
  [...readFileSync(new URL('../src/lib/empresa.ts', import.meta.url), 'utf8').matchAll(/^\s*(\w+): '([^']*)'/gm)].map(
    (m) => [m[1], m[2]],
  ),
)
function textoDaPagina(arquivo: string) {
  const fonte = readFileSync(new URL(`../src/features/legal/${arquivo}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  const inicio = fonte.indexOf('return (')
  return fonte
    .slice(inicio >= 0 ? inicio + 'return ('.length : 0)
    .replace(/\{empresa\.(\w+)\}/g, (_, chave: string) => VALORES_EMPRESA[chave] ?? '')
    .replace(/\{'\s*'\}/g, ' ')
    .replace(/titulo="([^"]*)"/g, '>$1<')
    .replace(/<\/?(strong|em|b|span|a|Link|code)\b[^>]*>/g, '')
    .replace(/<[^>]*>/g, '\n')
    .replace(/[{}]/g, '')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l && l !== ')' && l !== ');')
    .join('\n')
}
const TEXTO_TERMOS = textoDaPagina('TermosPage.tsx')
const TEXTO_PRIVACIDADE = textoDaPagina('PrivacidadePage.tsx')
const sha256 = (t: string) => createHash('sha256').update(t, 'utf8').digest('hex')
export const HASH_TERMOS = sha256(TEXTO_TERMOS)
export const HASH_PRIVACIDADE = sha256(TEXTO_PRIVACIDADE)

// Ao subir, guarda no banco o texto inteiro de cada versão em vigor (se ainda não estiver lá).
// É o que permite, anos depois, mostrar exatamente o que a pessoa aceitou ou assinou.
export async function registrarDocumentosLegais() {
  for (const [tipo, versao, hash, texto] of [
    ['contrato', VERSAO_CONTRATO, HASH_CONTRATO, TEXTO_CONTRATO],
    ['termos', VERSAO_TERMOS, HASH_TERMOS, TEXTO_TERMOS],
    ['privacidade', VERSAO_TERMOS, HASH_PRIVACIDADE, TEXTO_PRIVACIDADE],
  ]) {
    await pool.query(
      'insert into documentos_legais (tipo, versao, hash, texto) values (?, ?, ?, ?) on conflict (tipo, hash) do nothing',
      [tipo, versao, hash, texto],
    )
  }
}

// Cada aceite vira uma linha nova no histórico (nunca sobrescreve o anterior). Repetir o mesmo
// aceite (mesma pessoa, mesmos textos, mesma origem) não grava de novo: como o histórico não pode
// ser apagado, chamadas repetidas encheriam o banco para sempre.
export async function registrarAceite(
  pessoa: { id: string; padaria_id: string; nome: string; email: string },
  origem: 'cadastro' | 'primeiro-acesso' | 'novo-aceite' | 'contrato',
  req: { ip?: string; headers: Record<string, unknown> },
  conn: Pick<typeof pool, 'query'> = pool,
) {
  await conn.query(
    `insert into aceites_termos (id, padaria_id, usuario_id, nome, email, versao, hash_termos, hash_privacidade,
       origem, ip, navegador)
     select ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
     where not exists (
       select 1 from aceites_termos
       where usuario_id = ? and versao = ? and hash_termos = ? and hash_privacidade = ? and origem = ?
     )`,
    [
      randomUUID(),
      pessoa.padaria_id,
      pessoa.id,
      pessoa.nome,
      pessoa.email,
      VERSAO_TERMOS,
      HASH_TERMOS,
      HASH_PRIVACIDADE,
      origem,
      req.ip?.slice(0, 64) ?? null,
      String(req.headers['user-agent'] ?? '').slice(0, 255),
      pessoa.id,
      VERSAO_TERMOS,
      HASH_TERMOS,
      HASH_PRIVACIDADE,
      origem,
    ],
  )
}

// "Maria  de Souza" e "maria de souza" são o mesmo nome; acentos também não atrapalham.
const normalizarNome = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

// Na criação da conta: a caixa "Li e aceito" precisa vir marcada.
export const aceiteSchema = z.literal(true, 'Para criar a conta, aceite os Termos de Uso e a Política de Privacidade')

export const legalRouter = Router()

// Situação do aceite de quem está logado.
legalRouter.get('/termos', async (_req, res) => {
  const u = res.locals.usuario as Usuario
  const [rows] = await pool.query<RowDataPacket[]>(
    'select termos_versao, termos_aceitos_em from usuarios where id = ?',
    [u.id],
  )
  res.json({
    versao_atual: VERSAO_TERMOS,
    versao_aceita: rows[0]?.termos_versao ?? null,
    aceito_em: rows[0]?.termos_aceitos_em ?? null,
    // Quem administra a plataforma é o fornecedor do serviço: não aceita os termos de cliente.
    pendente: !u.plataforma_admin && rows[0]?.termos_versao !== VERSAO_TERMOS,
  })
})

legalRouter.post('/termos', async (req, res) => {
  validar(z.object({ aceite: aceiteSchema }), req.body)
  const u = res.locals.usuario as Usuario
  await registrarAceite(u, 'novo-aceite', req)
  await pool.query('update usuarios set termos_versao = ?, termos_aceitos_em = now() where id = ?', [
    VERSAO_TERMOS,
    u.id,
  ])
  esquecerUsuario(u.id)
  res.status(204).end()
})

// Contrato: só o dono assina (ele contrata em nome da padaria). Para os demais, não há pendência.
legalRouter.get('/contrato', async (_req, res) => {
  const u = res.locals.usuario as Usuario
  const [rows] = await pool.query<RowDataPacket[]>(
    `select nome_assinado, versao, hash_contrato, assinado_em from assinaturas_contrato
     where padaria_id = ? and hash_contrato = ? order by assinado_em desc limit 1`,
    [u.padaria_id, HASH_CONTRATO],
  )
  res.json({
    versao: VERSAO_CONTRATO,
    hash: HASH_CONTRATO,
    pendente: u.papel === 'dono' && !u.plataforma_admin && !rows[0],
    assinatura: rows[0] ?? null,
  })
})

// O contrato inclui os Termos e a Política: assinar também registra o aceite deles.
async function aceitarTermosPeloContrato(u: Usuario, req: { ip?: string; headers: Record<string, unknown> }) {
  await registrarAceite(u, 'contrato', req)
  await pool.query('update usuarios set termos_versao = ?, termos_aceitos_em = now() where id = ?', [
    VERSAO_TERMOS,
    u.id,
  ])
  esquecerUsuario(u.id)
}

legalRouter.post('/contrato', async (req, res) => {
  const u = res.locals.usuario as Usuario
  if (u.papel !== 'dono') throw new HttpError(403, 'Só o dono da padaria assina o contrato.')
  const { nome } = validar(
    z.object({
      nome: z.string().trim().min(3, 'Digite seu nome completo para assinar').max(255),
      aceite: z.literal(true, 'Marque que leu e concorda com o contrato'),
    }),
    req.body,
  )
  if (normalizarNome(nome) !== normalizarNome(u.nome)) {
    throw new HttpError(400, `Para assinar, digite o seu nome completo exatamente como está na conta: ${u.nome}`)
  }
  // Já assinou este mesmo texto? Devolve a assinatura existente, sem gravar outra linha.
  const [jaAssinou] = await pool.query<RowDataPacket[]>(
    `select nome_assinado, versao, hash_contrato, assinado_em from assinaturas_contrato
     where padaria_id = ? and hash_contrato = ? order by assinado_em limit 1`,
    [u.padaria_id, HASH_CONTRATO],
  )
  if (jaAssinou[0]) {
    await aceitarTermosPeloContrato(u, req)
    res.json(jaAssinou[0])
    return
  }
  const id = randomUUID()
  await pool.query(
    `insert into assinaturas_contrato (id, padaria_id, usuario_id, versao, nome_assinado, hash_contrato, ip, navegador,
       email_conta, padaria_nome)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, (select dados->>'nome_fantasia' from padarias where id = ?))`,
    [
      id,
      u.padaria_id,
      u.id,
      VERSAO_CONTRATO,
      nome,
      HASH_CONTRATO,
      req.ip?.slice(0, 64) ?? null,
      String(req.headers['user-agent'] ?? '').slice(0, 255),
      u.email,
      u.padaria_id,
    ],
  )
  await aceitarTermosPeloContrato(u, req)
  const [[assinatura]] = await pool.query<RowDataPacket[]>(
    'select nome_assinado, versao, hash_contrato, assinado_em from assinaturas_contrato where id = ?',
    [id],
  )
  res.status(201).json(assinatura)
})

// Meus dados (LGPD, art. 18, II e V): tudo o que o sistema guarda sobre a própria pessoa, num
// arquivo para baixar. Não inclui a senha (só existe o hash, que não serve a ninguém).
legalRouter.get('/meus-dados', async (_req, res) => {
  const u = res.locals.usuario as Usuario
  const [[pessoa], [acessos], [historico], [resumo], [assinaturas], [aceites], [administracao]] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `select u.nome, u.email, u.papel, u.cargo, u.foto, u.telefone, u.cpf, u.data_nascimento,
              u.data_admissao, u.turno, u.endereco, u.contato_emergencia, u.ativo, u.created_at,
              u.ultimo_acesso, u.termos_versao, u.termos_aceitos_em,
              p.dados->>'nome_fantasia' as padaria
       from usuarios u left join padarias p on p.id = u.padaria_id where u.id = ?`,
      [u.id],
    ),
    pool.query<RowDataPacket[]>(
      `select evento, ip, navegador, created_at from log_acessos
       where usuario_id = ? order by created_at desc limit 500`,
      [u.id],
    ),
    pool.query<RowDataPacket[]>(
      `select campo, valor_antigo, valor_novo, created_at from historico_perfil
       where usuario_id = ? order by created_at desc`,
      [u.id],
    ),
    pool.query<RowDataPacket[]>(
      `select (select count(*)::int from vendas where created_by = ?) as vendas_registradas,
              (select count(*)::int from caixas where operador_id = ?) as caixas_abertos,
              (select count(*)::int from movimentacoes_estoque where created_by = ?) as movimentacoes_estoque`,
      [u.id, u.id, u.id],
    ),
    pool.query<RowDataPacket[]>(
      `select versao, nome_assinado, hash_contrato, ip, navegador, assinado_em
       from assinaturas_contrato where usuario_id = ? order by assinado_em desc`,
      [u.id],
    ),
    pool.query<RowDataPacket[]>(
      `select versao, origem, hash_termos, hash_privacidade, ip, navegador, aceito_em
       from aceites_termos where usuario_id = ? order by aceito_em desc`,
      [u.id],
    ),
    // Transparência: o que a administração do Coffee Break fez sobre a própria pessoa.
    pool.query<RowDataPacket[]>(
      `select acao, motivo, created_at from plataforma_acoes
       where alvo_usuario_id = ? order by created_at desc`,
      [u.id],
    ),
  ])
  const arquivo = {
    sobre: 'Seus dados pessoais no Coffee Break (LGPD, art. 18). Vendas e demais registros da padaria pertencem à padaria e aparecem aqui só como totais.',
    exportado_em: new Date().toISOString(),
    perfil: pessoa[0] ?? null,
    registros_de_acesso: acessos,
    historico_do_perfil: historico,
    atividade_na_padaria: resumo[0] ?? null,
    contratos_assinados: assinaturas,
    aceites_dos_termos: aceites,
    acoes_da_administracao_sobre_voce: administracao,
  }
  res.setHeader('Content-Disposition', 'attachment; filename="meus-dados-coffee-break.json"')
  res.json(arquivo)
})
