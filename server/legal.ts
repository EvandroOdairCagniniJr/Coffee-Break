// Conformidade legal (LGPD, Marco Civil): versão dos Termos de Uso / Política de Privacidade,
// registro do aceite e o direito do titular de acessar e levar os próprios dados (LGPD, art. 18).
// Ao mudar os textos de forma relevante, troque VERSAO_TERMOS: todos aceitam de novo no próximo
// acesso. A mesma data fica em src/lib/empresa.ts (exibida nas páginas).
import { Router } from 'express'
import { z } from 'zod'
import type { RowDataPacket } from './db.ts'
import { pool } from './db.ts'
import type { Usuario } from './auth.ts'
import { esquecerUsuario } from './cacheUsuarios.ts'
import { validar } from './http.ts'

export const VERSAO_TERMOS = '2026-11-03'

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
    pendente: rows[0]?.termos_versao !== VERSAO_TERMOS,
  })
})

legalRouter.post('/termos', async (req, res) => {
  validar(z.object({ aceite: aceiteSchema }), req.body)
  const u = res.locals.usuario as Usuario
  await pool.query('update usuarios set termos_versao = ?, termos_aceitos_em = now() where id = ?', [
    VERSAO_TERMOS,
    u.id,
  ])
  esquecerUsuario(u.id)
  res.status(204).end()
})

// Meus dados (LGPD, art. 18, II e V): tudo o que o sistema guarda sobre a própria pessoa, num
// arquivo para baixar. Não inclui a senha (só existe o hash, que não serve a ninguém).
legalRouter.get('/meus-dados', async (_req, res) => {
  const u = res.locals.usuario as Usuario
  const [[pessoa], [acessos], [historico], [resumo]] = await Promise.all([
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
  ])
  const arquivo = {
    sobre: 'Seus dados pessoais no Coffee Break (LGPD, art. 18). Vendas e demais registros da padaria pertencem à padaria e aparecem aqui só como totais.',
    exportado_em: new Date().toISOString(),
    perfil: pessoa[0] ?? null,
    registros_de_acesso: acessos,
    historico_do_perfil: historico,
    atividade_na_padaria: resumo[0] ?? null,
  }
  res.setHeader('Content-Disposition', 'attachment; filename="meus-dados-coffee-break.json"')
  res.json(arquivo)
})
