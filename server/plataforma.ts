// Administração da plataforma Coffee Break (um único administrador, o responsável pelo sistema):
// visão geral, padarias e liberação, pessoas de todas as padarias, atividade e comunicados.
// Para quem não é o administrador, estas rotas respondem como se não existissem (404).
import { randomUUID } from 'node:crypto'
import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import type { PoolConnection, RowDataPacket } from './db.ts'
import { pool, transaction } from './db.ts'
import type { StatusPadaria, Usuario } from './auth.ts'
import { esquecerTodos, esquecerUsuario } from './cacheUsuarios.ts'
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

// Só o necessário (LGPD, art. 6º, III): a administração vê CPF e telefone mascarados.
export function mascararCpf(cpf: unknown) {
  const d = String(cpf ?? '').replace(/\D/g, '')
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : d ? '***' : null
}
export function mascararTelefone(tel: unknown) {
  const d = String(tel ?? '').replace(/\D/g, '')
  return d.length >= 8 ? `(**) ****-${d.slice(-4)}` : d ? '****' : null
}
const FUSO = 'America/Sao_Paulo'
// Só as padarias que aparecem para a administração (não as ocultas, como a que foi criada só
// para abrir a conta do administrador).
const VISIVEL = 'padaria_id not in (select id from padarias where oculta)'
const VISIVEL_V = 'v.padaria_id not in (select id from padarias where oculta)'

// Toda decisão da administração fica registrada (plataforma_acoes é imutável).
async function registrarAcao(
  conn: Pick<PoolConnection, 'query'>,
  req: Request,
  dados: {
    acao: string
    padariaId?: string | null
    alvoUsuarioId?: string | null
    de?: string | null
    para?: string | null
    motivo?: string | null
  },
) {
  const admin = (req.res?.locals.usuario as Usuario | undefined)?.id
  if (!admin) throw new HttpError(401, 'Sua sessão expirou. Entre novamente.')
  await conn.query(
    `insert into plataforma_acoes (id, admin_id, padaria_id, alvo_usuario_id, acao, status_anterior, status_novo, motivo, ip)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      admin,
      dados.padariaId ?? null,
      dados.alvoUsuarioId ?? null,
      dados.acao,
      dados.de ?? null,
      dados.para ?? null,
      dados.motivo ?? null,
      req.ip?.slice(0, 64) ?? null,
    ],
  )
}

// ------------------------------------------------------------------ visão geral

plataformaRouter.get('/resumo', async (_req, res) => {
  const [porStatus] = await pool.query<RowDataPacket[]>('select status, count(*)::int as n from padarias where not oculta group by status')
  const [[totais]] = await pool.query<RowDataPacket[]>(
    `select (select count(*)::int from usuarios where ativo = true) as usuarios_ativos,
            (select count(*)::int from usuarios where ultimo_acesso > now() - interval '1 day') as pessoas_hoje,
            (select count(*)::int from vendas where created_at > now() - interval '30 days' and status <> 'devolvida'
               and ${VISIVEL}) as vendas_30_dias,
            (select coalesce(sum(total), 0)::float from vendas
              where created_at > now() - interval '30 days' and status <> 'devolvida' and ${VISIVEL}) as faturamento_30_dias,
            (select count(distinct padaria_id)::int from vendas
              where created_at > now() - interval '1 day' and ${VISIVEL}) as padarias_vendendo_hoje,
            (select count(*)::int from padarias where created_at > now() - interval '7 days' and not oculta) as novas_7_dias,
            (select count(*)::int from padarias where created_at > now() - interval '30 days' and not oculta) as novas_30_dias,
            (select count(*)::int from log_acessos where evento in ('login_falhou', 'conta_bloqueada')
               and created_at > now() - interval '1 day') as alertas_24h`,
  )
  // Últimos 30 dias, dia a dia, no horário de Brasília.
  const [serie] = await pool.query<RowDataPacket[]>(
    `with dias as (
       select generate_series((now() at time zone '${FUSO}')::date - 29, (now() at time zone '${FUSO}')::date, interval '1 day')::date as dia
     )
     select to_char(d.dia, 'YYYY-MM-DD') as dia,
            (select count(*)::int from padarias p
              where (p.created_at at time zone '${FUSO}')::date = d.dia and not p.oculta) as cadastros,
            (select count(*)::int from vendas v
              where (v.created_at at time zone '${FUSO}')::date = d.dia and v.status <> 'devolvida' and ${VISIVEL_V}) as vendas,
            (select coalesce(sum(v.total), 0)::float from vendas v
              where (v.created_at at time zone '${FUSO}')::date = d.dia and v.status <> 'devolvida' and ${VISIVEL_V}) as faturamento
     from dias d order by d.dia`,
  )
  const [fila] = await pool.query<RowDataPacket[]>(
    `select p.id, p.status, p.created_at, p.dados->>'nome_fantasia' as nome_fantasia,
            (select count(*)::int from padaria_documentos x where x.padaria_id = p.id) as documentos
     from padarias p where p.status = 'pendente' and not p.oculta order by p.created_at limit 6`,
  )
  const contagem = Object.fromEntries(STATUS.map((s) => [s, 0])) as Record<StatusPadaria, number>
  for (const r of porStatus) contagem[r.status as StatusPadaria] = r.n
  res.json({ por_status: contagem, ...totais, serie, fila })
})

// Busca rápida (Ctrl+K): padarias e pessoas de uma vez.
plataformaRouter.get('/busca', async (req, res) => {
  const { q } = validar(z.object({ q: z.string().trim().min(2).max(100) }), req.query)
  const termo = `%${q.toLowerCase()}%`
  const [padarias] = await pool.query<RowDataPacket[]>(
    `select id, status, dados->>'nome_fantasia' as nome, dados->>'cnpj' as cnpj from padarias
     where not oculta and lower(coalesce(dados->>'nome_fantasia', '') || ' ' || coalesce(dados->>'razao_social', '') || ' ' || coalesce(dados->>'cnpj', '')) like ?
     order by created_at desc limit 6`,
    [termo],
  )
  const [pessoas] = await pool.query<RowDataPacket[]>(
    `select u.id, u.nome, u.email, u.papel, u.padaria_id, p.dados->>'nome_fantasia' as padaria
     from usuarios u left join padarias p on p.id = u.padaria_id
     where lower(u.nome || ' ' || u.email) like ? order by u.created_at desc limit 6`,
    [termo],
  )
  res.json({ padarias, pessoas })
})

// ------------------------------------------------------------------ padarias

const filtroPadarias = z.object({
  status: z.enum(STATUS).optional(),
  busca: z.string().trim().max(100).optional(),
  formato: z.enum(['json', 'csv']).optional(),
})

// Planilha: impede que um texto vire fórmula ao abrir no Excel (injeção de fórmula).
function celulaCsv(v: unknown) {
  let t = v === null || v === undefined ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`
  return `"${t.replace(/"/g, '""')}"`
}

plataformaRouter.get('/padarias', async (req, res) => {
  const filtro = validar(filtroPadarias, req.query)
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
            (select max(x.ultimo_acesso) from usuarios x where x.padaria_id = p.id) as ultimo_acesso,
            (select count(*)::int from vendas x where x.padaria_id = p.id and x.created_at > now() - interval '30 days'
               and x.status <> 'devolvida') as vendas_30_dias
     from padarias p
     left join lateral (
       select nome, email from usuarios where padaria_id = p.id and papel = 'dono' order by created_at limit 1
     ) d on true
     where not p.oculta and (?::text is null or p.status = ?)
       and (?::text is null or lower(coalesce(p.dados->>'nome_fantasia', '') || ' ' || coalesce(p.dados->>'razao_social', '')
            || ' ' || coalesce(p.dados->>'cnpj', '') || ' ' || coalesce(d.email, '') || ' ' || coalesce(d.nome, '')) like ?)
     order by case p.status when 'pendente' then 0 when 'recusada' then 1 when 'suspensa' then 2 else 3 end,
              p.created_at desc
     limit 500`,
    [filtro.status ?? null, filtro.status ?? null, termo, termo],
  )
  if (filtro.formato === 'csv') {
    const colunas = [
      ['Padaria', 'nome_fantasia'],
      ['Razão social', 'razao_social'],
      ['CNPJ', 'cnpj'],
      ['Cidade', 'cidade'],
      ['UF', 'uf'],
      ['Situação', 'status'],
      ['Dono', 'dono_nome'],
      ['E-mail do dono', 'dono_email'],
      ['Pessoas', 'pessoas'],
      ['Vendas (30 dias)', 'vendas_30_dias'],
      ['Cadastro', 'created_at'],
      ['Último acesso', 'ultimo_acesso'],
    ] as const
    const linhas = [colunas.map(([t]) => celulaCsv(t)).join(';')]
    for (const p of padarias) linhas.push(colunas.map(([, c]) => celulaCsv(p[c] instanceof Date ? p[c].toISOString() : p[c])).join(';'))
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="padarias-coffee-break.csv"')
    // BOM: o Excel abre com acentos certos.
    res.send('﻿' + linhas.join('\r\n'))
    return
  }
  res.json(padarias)
})

plataformaRouter.get('/padarias/:id', async (req, res) => {
  const id = req.params.id
  const [[padaria]] = await pool.query<RowDataPacket[]>(
    'select id, dados, status, status_motivo, status_em, codigo_convite, created_at from padarias where id = ?',
    [id],
  )
  if (!padaria) throw new HttpError(404, 'Padaria não encontrada')
  const [[pessoas], [documentos], [assinaturas], [aceites], [historico], [notas], [acessos], [[numeros]]] = await Promise.all([
    pool.query<RowDataPacket[]>(
      // Minimização (LGPD, art. 6º, III): sem data de nascimento nem endereço; CPF e telefone saem
      // mascarados. O dado completo só com motivo registrado (POST /pessoas/:id/dados-completos).
      `select id, nome, email, papel, cargo, ativo, telefone, cpf,
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
      `select a.acao, a.status_anterior, a.status_novo, a.motivo, a.created_at, u.nome as admin, alvo.nome as alvo
       from plataforma_acoes a
       left join usuarios u on u.id = a.admin_id
       left join usuarios alvo on alvo.id = a.alvo_usuario_id
       where a.padaria_id = ? order by a.created_at desc limit 100`,
      [id],
    ),
    pool.query<RowDataPacket[]>(
      `select n.id, n.texto, n.created_at, u.nome as autor from plataforma_notas n
       left join usuarios u on u.id = n.admin_id where n.padaria_id = ? order by n.created_at desc`,
      [id],
    ),
    pool.query<RowDataPacket[]>(
      `select l.evento, l.email, l.ip, l.created_at from log_acessos l
       where l.padaria_id = ? order by l.created_at desc limit 30`,
      [id],
    ),
    pool.query<RowDataPacket[]>(
      `select (select count(*)::int from produtos where padaria_id = ?) as produtos,
              (select count(*)::int from vendas where padaria_id = ? and status <> 'devolvida') as vendas,
              (select coalesce(sum(total), 0)::float from vendas where padaria_id = ? and status <> 'devolvida') as faturamento,
              (select coalesce(sum(total), 0)::float from vendas where padaria_id = ? and status <> 'devolvida'
                 and created_at > now() - interval '30 days') as faturamento_30_dias,
              (select max(created_at) from vendas where padaria_id = ?) as ultima_venda,
              (select count(*)::int from encomendas where padaria_id = ?) as encomendas`,
      [id, id, id, id, id, id],
    ),
  ])
  const pessoasMascaradas = pessoas.map((p) => ({ ...p, cpf: mascararCpf(p.cpf), telefone: mascararTelefone(p.telefone) }))
  res.json({ ...padaria, pessoas: pessoasMascaradas, documentos, assinaturas, aceites, historico, notas, acessos, numeros })
})

plataformaRouter.get('/padarias/:id/documentos/:doc', async (req, res) => {
  const [[doc]] = await pool.query<RowDataPacket[]>(
    'select nome_arquivo, descricao, tipo, conteudo from padaria_documentos where id = ? and padaria_id = ?',
    [req.params.doc, req.params.id],
  )
  if (!doc) throw new HttpError(404, 'Documento não encontrado')
  // Quem abriu cada documento fica registrado (LGPD, art. 37).
  await registrarAcao(pool, req, { acao: 'baixar_documento', padariaId: req.params.id, motivo: String(doc.descricao) })
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
    const [[atual]] = await conn.query<RowDataPacket[]>('select status from padarias where id = ? for update', [req.params.id])
    if (!atual) throw new HttpError(404, 'Padaria não encontrada')
    if (!(regra.de as readonly string[]).includes(atual.status)) {
      throw new HttpError(409, `Não dá para ${acao} uma padaria com situação "${atual.status}".`)
    }
    await conn.query('update padarias set status = ?, status_motivo = ?, status_em = now() where id = ?', [
      regra.para,
      regra.motivo ? motivo : null,
      req.params.id,
    ])
    await registrarAcao(conn, req, { acao, padariaId: req.params.id, de: atual.status, para: regra.para, motivo })
    return { status: regra.para }
  })
  // A situação nova vale no próximo pedido de cada pessoa da padaria.
  esquecerTodos()
  res.json(resultado)
})

plataformaRouter.post('/padarias/:id/notas', async (req, res) => {
  const { texto } = validar(z.object({ texto: z.string().trim().min(1, 'Escreva a anotação').max(2000) }), req.body)
  const [[existe]] = await pool.query<RowDataPacket[]>('select 1 as ok from padarias where id = ?', [req.params.id])
  if (!existe) throw new HttpError(404, 'Padaria não encontrada')
  const admin = res.locals.usuario as Usuario
  await pool.query('insert into plataforma_notas (id, padaria_id, admin_id, texto) values (?, ?, ?, ?)', [
    randomUUID(),
    req.params.id,
    admin.id,
    texto,
  ])
  res.status(201).json({ ok: true })
})

// Derruba os logins de todas as pessoas da padaria (ex.: suspeita de senha vazada).
plataformaRouter.post('/padarias/:id/encerrar-sessoes', async (req, res) => {
  const admin = res.locals.usuario as Usuario
  const [r] = await pool.query<RowDataPacket[]>(
    'update usuarios set sessao_versao = sessao_versao + 1 where padaria_id = ? and id <> ? returning id',
    [req.params.id, admin.id],
  )
  await registrarAcao(pool, req, { acao: 'encerrar_sessoes', padariaId: req.params.id })
  esquecerTodos()
  res.json({ pessoas: r.length })
})

// ------------------------------------------------------------------ pessoas

plataformaRouter.get('/pessoas', async (req, res) => {
  const filtro = validar(
    z.object({
      busca: z.string().trim().max(100).optional(),
      situacao: z.enum(['ativas', 'bloqueadas', 'todas']).optional(),
    }),
    req.query,
  )
  const termo = filtro.busca ? `%${filtro.busca.toLowerCase()}%` : null
  const situacao = filtro.situacao ?? 'todas'
  const [pessoas] = await pool.query<RowDataPacket[]>(
    `select u.id, u.nome, u.email, u.papel, u.cargo, u.ativo, u.created_at, u.ultimo_acesso, u.plataforma_admin,
            u.padaria_id, p.dados->>'nome_fantasia' as padaria, p.status as padaria_status,
            (u.bloqueado_ate is not null and u.bloqueado_ate > now()) as bloqueio_por_senha
     from usuarios u left join padarias p on p.id = u.padaria_id
     where (?::text is null or lower(u.nome || ' ' || u.email || ' ' || coalesce(p.dados->>'nome_fantasia', '')) like ?)
       and (? = 'todas' or (? = 'ativas' and u.ativo) or (? = 'bloqueadas' and not u.ativo))
     order by u.ultimo_acesso desc nulls last, u.created_at desc
     limit 500`,
    [termo, termo, situacao, situacao, situacao],
  )
  res.json(pessoas)
})

// Dado completo de uma pessoa (CPF, telefone, nascimento, endereço): só com um motivo, que fica
// registrado no histórico e aparece para a própria pessoa em "Baixar meus dados".
plataformaRouter.post('/pessoas/:id/dados-completos', async (req, res) => {
  const { motivo } = validar(
    z.object({ motivo: z.string().trim().min(10, 'Diga por que precisa ver os dados completos (pelo menos 10 letras)').max(300) }),
    req.body,
  )
  const [[p]] = await pool.query<RowDataPacket[]>(
    'select id, padaria_id, nome, cpf, telefone, data_nascimento, endereco from usuarios where id = ?',
    [req.params.id],
  )
  if (!p) throw new HttpError(404, 'Pessoa não encontrada')
  await registrarAcao(pool, req, { acao: 'ver_dados_pessoais', padariaId: p.padaria_id, alvoUsuarioId: p.id, motivo })
  res.json({ cpf: p.cpf, telefone: p.telefone, data_nascimento: p.data_nascimento, endereco: p.endereco })
})

async function pessoaAlvo(req: Request) {
  const admin = req.res?.locals.usuario as Usuario
  if (req.params.id === admin.id) throw new HttpError(400, 'Esta é a sua conta de administração.')
  const [[pessoa]] = await pool.query<RowDataPacket[]>('select id, padaria_id, ativo from usuarios where id = ?', [req.params.id])
  if (!pessoa) throw new HttpError(404, 'Pessoa não encontrada')
  return pessoa
}

plataformaRouter.post('/pessoas/:id/acesso', async (req, res) => {
  const { ativo, motivo } = validar(
    z.object({ ativo: z.boolean(), motivo: z.string().trim().max(500).optional() }),
    req.body,
  )
  const pessoa = await pessoaAlvo(req)
  await transaction(async (conn) => {
    // Bloquear também derruba os logins abertos.
    await conn.query('update usuarios set ativo = ?, sessao_versao = sessao_versao + 1 where id = ?', [ativo, pessoa.id])
    await registrarAcao(conn, req, {
      acao: ativo ? 'reativar_pessoa' : 'bloquear_pessoa',
      padariaId: pessoa.padaria_id,
      alvoUsuarioId: pessoa.id,
      motivo,
    })
  })
  esquecerUsuario(pessoa.id)
  res.json({ ativo })
})

plataformaRouter.post('/pessoas/:id/encerrar-sessoes', async (req, res) => {
  const pessoa = await pessoaAlvo(req)
  await pool.query('update usuarios set sessao_versao = sessao_versao + 1 where id = ?', [pessoa.id])
  await registrarAcao(pool, req, { acao: 'encerrar_sessoes', padariaId: pessoa.padaria_id, alvoUsuarioId: pessoa.id })
  esquecerUsuario(pessoa.id)
  res.json({ ok: true })
})

// ------------------------------------------------------------------ atividade

plataformaRouter.get('/atividade', async (req, res) => {
  const { tipo } = validar(z.object({ tipo: z.enum(['acessos', 'alertas', 'decisoes']).optional() }), req.query)
  if (tipo === 'decisoes') {
    const [linhas] = await pool.query<RowDataPacket[]>(
      `select a.id, a.acao, a.status_anterior, a.status_novo, a.motivo, a.ip, a.created_at,
              p.dados->>'nome_fantasia' as padaria, a.padaria_id, alvo.nome as alvo, u.nome as admin
       from plataforma_acoes a
       left join padarias p on p.id = a.padaria_id
       left join usuarios alvo on alvo.id = a.alvo_usuario_id
       left join usuarios u on u.id = a.admin_id
       order by a.created_at desc limit 200`,
    )
    res.json(linhas)
    return
  }
  const [linhas] = await pool.query<RowDataPacket[]>(
    `select l.id, l.evento, l.email, l.ip, l.navegador, l.created_at, l.padaria_id,
            p.dados->>'nome_fantasia' as padaria, u.nome
     from log_acessos l
     left join padarias p on p.id = l.padaria_id
     left join usuarios u on u.id = l.usuario_id
     where (? <> 'alertas' or l.evento in ('login_falhou', 'conta_bloqueada'))
     order by l.created_at desc limit 200`,
    [tipo ?? 'acessos'],
  )
  res.json(linhas)
})

// ------------------------------------------------------------------ comunicados

const comunicadoSchema = z.object({
  titulo: z.string().trim().min(3, 'Dê um título').max(120),
  texto: z.string().trim().min(5, 'Escreva o comunicado').max(600),
  tom: z.enum(['info', 'aviso', 'novidade']).default('info'),
  publico: z.enum(['todos', 'donos', 'gestao']).default('todos'),
  expira_em: z.iso.datetime({ offset: true }).nullish(),
})

plataformaRouter.get('/comunicados', async (_req, res) => {
  const [linhas] = await pool.query<RowDataPacket[]>(
    `select id, titulo, texto, tom, publico, ativo, expira_em, created_at from plataforma_comunicados
     order by created_at desc limit 100`,
  )
  res.json(linhas)
})

plataformaRouter.post('/comunicados', async (req, res) => {
  const c = validar(comunicadoSchema, req.body)
  const admin = res.locals.usuario as Usuario
  const id = randomUUID()
  await pool.query(
    `insert into plataforma_comunicados (id, titulo, texto, tom, publico, expira_em, criado_por)
     values (?, ?, ?, ?, ?, ?, ?)`,
    [id, c.titulo, c.texto, c.tom, c.publico, c.expira_em ?? null, admin.id],
  )
  await registrarAcao(pool, req, { acao: 'publicar_comunicado', motivo: c.titulo })
  res.status(201).json({ id })
})

plataformaRouter.patch('/comunicados/:id', async (req, res) => {
  const { ativo } = validar(z.object({ ativo: z.boolean() }), req.body)
  const [r] = await pool.query<RowDataPacket[]>('update plataforma_comunicados set ativo = ? where id = ? returning titulo', [
    ativo,
    req.params.id,
  ])
  if (!r.length) throw new HttpError(404, 'Comunicado não encontrado')
  await registrarAcao(pool, req, { acao: ativo ? 'republicar_comunicado' : 'encerrar_comunicado', motivo: String(r[0].titulo) })
  res.json({ ativo })
})
