// Administração da plataforma Coffee Break (só o responsável pelo sistema): ver todas as
// padarias, o cadastro e os documentos de cada uma, e liberar, recusar, suspender ou reativar.
// Para quem não é administrador, estas rotas respondem como se não existissem (404).
import { randomUUID } from 'node:crypto'
import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import type { RowDataPacket } from './db.ts'
import { pool, transaction } from './db.ts'
import type { StatusPadaria, Usuario } from './auth.ts'
import { esquecerTodos } from './cacheUsuarios.ts'
import { HttpError, validar } from './http.ts'

export const plataformaRouter = Router()

// Confere no banco a cada pedido (sem o cache de sessão): tirar a marca vale na hora.
async function exigirAdministracao(_req: Request, res: Response, next: NextFunction) {
  const u = res.locals.usuario as Usuario | undefined
  if (u?.plataforma_admin) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'select 1 from usuarios where id = ? and ativo = true and plataforma_admin = true',
      [u.id],
    )
    if (rows.length) {
      next()
      return
    }
  }
  res.status(404).json({ message: 'Rota não encontrada' })
}
plataformaRouter.use(exigirAdministracao)

const STATUS: StatusPadaria[] = ['pendente', 'aprovada', 'recusada', 'suspensa']

plataformaRouter.get('/resumo', async (_req, res) => {
  const [porStatus] = await pool.query<RowDataPacket[]>(
    'select status, count(*)::int as n from padarias group by status',
  )
  const [[totais]] = await pool.query<RowDataPacket[]>(
    `select (select count(*)::int from usuarios where ativo = true) as usuarios_ativos,
            (select count(*)::int from vendas where created_at > now() - interval '30 days') as vendas_30_dias,
            (select coalesce(sum(total), 0)::float from vendas
              where created_at > now() - interval '30 days' and status <> 'devolvida') as faturamento_30_dias,
            (select count(*)::int from padarias where created_at > now() - interval '7 days') as novas_7_dias`,
  )
  const contagem = Object.fromEntries(STATUS.map((s) => [s, 0])) as Record<StatusPadaria, number>
  for (const r of porStatus) contagem[r.status as StatusPadaria] = r.n
  res.json({ por_status: contagem, ...totais })
})

plataformaRouter.get('/padarias', async (req, res) => {
  const filtro = validar(
    z.object({
      status: z.enum(STATUS).optional(),
      busca: z.string().trim().max(100).optional(),
    }),
    req.query,
  )
  const termo = filtro.busca ? `%${filtro.busca.toLowerCase()}%` : null
  const [padarias] = await pool.query<RowDataPacket[]>(
    `select p.id, p.status, p.status_motivo, p.status_em, p.created_at,
            p.dados->>'nome_fantasia' as nome_fantasia, p.dados->>'razao_social' as razao_social,
            p.dados->>'cnpj' as cnpj, p.dados->'endereco'->>'cidade' as cidade,
            p.dados->'endereco'->>'uf' as uf,
            d.nome as dono_nome, d.email as dono_email,
            (select count(*)::int from usuarios x where x.padaria_id = p.id) as pessoas,
            (select count(*)::int from padaria_documentos x where x.padaria_id = p.id) as documentos,
            (select count(*)::int from assinaturas_contrato x where x.padaria_id = p.id) > 0 as contrato_assinado,
            (select max(x.ultimo_acesso) from usuarios x where x.padaria_id = p.id) as ultimo_acesso
     from padarias p
     left join lateral (
       select nome, email from usuarios where padaria_id = p.id and papel = 'dono' order by created_at limit 1
     ) d on true
     where (?::text is null or p.status = ?)
       and (?::text is null or lower(coalesce(p.dados->>'nome_fantasia', '') || ' ' || coalesce(p.dados->>'razao_social', '')
            || ' ' || coalesce(p.dados->>'cnpj', '') || ' ' || coalesce(d.email, '') || ' ' || coalesce(d.nome, '')) like ?)
     order by case p.status when 'pendente' then 0 when 'recusada' then 1 when 'suspensa' then 2 else 3 end,
              p.created_at desc
     limit 300`,
    [filtro.status ?? null, filtro.status ?? null, termo, termo],
  )
  res.json(padarias)
})

plataformaRouter.get('/padarias/:id', async (req, res) => {
  const id = req.params.id
  const [[padaria]] = await pool.query<RowDataPacket[]>(
    'select id, dados, status, status_motivo, status_em, codigo_convite, created_at from padarias where id = ?',
    [id],
  )
  if (!padaria) throw new HttpError(404, 'Padaria não encontrada')
  const [[pessoas], [documentos], [assinaturas], [aceites], [historico], [[numeros]]] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `select id, nome, email, papel, cargo, ativo, telefone, cpf, data_nascimento, endereco,
              created_at, ultimo_acesso, termos_versao, termos_aceitos_em
       from usuarios where padaria_id = ?
       order by case papel when 'dono' then 0 when 'admin' then 1 else 2 end, created_at`,
      [id],
    ),
    pool.query<RowDataPacket[]>(
      `select id, descricao, nome_arquivo, tipo, tamanho, created_at from padaria_documentos
       where padaria_id = ? order by created_at`,
      [id],
    ),
    pool.query<RowDataPacket[]>(
      `select nome_assinado, email_conta, versao, hash_contrato, ip, navegador, assinado_em
       from assinaturas_contrato where padaria_id = ? order by assinado_em desc`,
      [id],
    ),
    pool.query<RowDataPacket[]>(
      `select nome, email, versao, origem, ip, aceito_em from aceites_termos
       where padaria_id = ? order by aceito_em desc limit 50`,
      [id],
    ),
    pool.query<RowDataPacket[]>(
      `select a.acao, a.status_anterior, a.status_novo, a.motivo, a.created_at, u.nome as admin
       from plataforma_acoes a left join usuarios u on u.id = a.admin_id
       where a.padaria_id = ? order by a.created_at desc`,
      [id],
    ),
    pool.query<RowDataPacket[]>(
      `select (select count(*)::int from produtos where padaria_id = ?) as produtos,
              (select count(*)::int from vendas where padaria_id = ?) as vendas,
              (select coalesce(sum(total), 0)::float from vendas where padaria_id = ? and status <> 'devolvida') as faturamento,
              (select max(created_at) from vendas where padaria_id = ?) as ultima_venda`,
      [id, id, id, id],
    ),
  ])
  res.json({ ...padaria, pessoas, documentos, assinaturas, aceites, historico, numeros })
})

plataformaRouter.get('/padarias/:id/documentos/:doc', async (req, res) => {
  const [[doc]] = await pool.query<RowDataPacket[]>(
    'select nome_arquivo, tipo, conteudo from padaria_documentos where id = ? and padaria_id = ?',
    [req.params.doc, req.params.id],
  )
  if (!doc) throw new HttpError(404, 'Documento não encontrado')
  // Sempre como download e com o tipo conferido no envio: o navegador não executa nada.
  res.setHeader('Content-Type', doc.tipo)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox")
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(doc.nome_arquivo)}`)
  res.send(doc.conteudo)
})

// Para onde cada ação leva, e de onde ela pode partir.
const ACOES = {
  aprovar: { de: ['pendente', 'recusada'], para: 'aprovada', motivo: false },
  recusar: { de: ['pendente'], para: 'recusada', motivo: true },
  suspender: { de: ['aprovada'], para: 'suspensa', motivo: true },
  reativar: { de: ['suspensa'], para: 'aprovada', motivo: false },
} as const satisfies Record<string, { de: readonly StatusPadaria[]; para: StatusPadaria; motivo: boolean }>

plataformaRouter.post('/padarias/:id/status', async (req, res) => {
  const admin = res.locals.usuario as Usuario
  const { acao, motivo } = validar(
    z.object({
      acao: z.enum(Object.keys(ACOES) as [keyof typeof ACOES, ...(keyof typeof ACOES)[]]),
      motivo: z.string().trim().max(1000).optional(),
    }),
    req.body,
  )
  const regra = ACOES[acao]
  if (regra.motivo && (!motivo || motivo.length < 10)) {
    throw new HttpError(400, 'Explique o motivo para o dono (pelo menos 10 letras): ele vê esta mensagem.')
  }
  const resultado = await transaction(async (conn) => {
    const [[atual]] = await conn.query<RowDataPacket[]>('select status from padarias where id = ? for update', [
      req.params.id,
    ])
    if (!atual) throw new HttpError(404, 'Padaria não encontrada')
    if (!(regra.de as readonly string[]).includes(atual.status)) {
      throw new HttpError(409, `Não dá para ${acao} uma padaria com situação "${atual.status}".`)
    }
    await conn.query('update padarias set status = ?, status_motivo = ?, status_em = now() where id = ?', [
      regra.para,
      regra.motivo ? motivo : null,
      req.params.id,
    ])
    await conn.query(
      `insert into plataforma_acoes (id, admin_id, padaria_id, acao, status_anterior, status_novo, motivo, ip)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), admin.id, req.params.id, acao, atual.status, regra.para, motivo ?? null, req.ip?.slice(0, 64) ?? null],
    )
    return { status: regra.para }
  })
  // A situação nova vale no próximo pedido de cada pessoa da padaria.
  esquecerTodos()
  res.json(resultado)
})
