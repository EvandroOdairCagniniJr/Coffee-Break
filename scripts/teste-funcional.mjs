// Teste funcional automático: os cenários do dia a dia da padaria, de ponta a ponta, conferindo
// valores, estoque e caixa centavo por centavo. Cenários descritos em docs/TESTES.md.
// Uso: npm run teste:funcional
//
// Roda isolado, como o teste de segurança: banco temporário em memória e servidor numa porta
// própria. Não toca no Supabase nem no servidor da porta 3000. Os dados são fictícios.
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'

const PORTA_BANCO = 5488
const PORTA = 3988
const BASE = `http://localhost:${PORTA}/api`
const SENHA = 'Funcional123'

const db = await PGlite.create()
const banco = new PGLiteSocketServer({ db, port: PORTA_BANCO, host: '127.0.0.1', maxConnections: 20 })
await banco.start()
const servidor = spawn(process.execPath, ['server/index.ts'], {
  env: {
    ...process.env,
    PORT: String(PORTA),
    DATABASE_URL: `postgres://postgres@127.0.0.1:${PORTA_BANCO}/postgres`,
    DATABASE_SSL: 'false',
    DATABASE_POOL: '1',
    JWT_SECRET: randomBytes(32).toString('hex'),
    NODE_ENV: 'test',
    SMTP_HOST: '',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let logServidor = ''
servidor.stdout.on('data', (d) => (logServidor += d))
servidor.stderr.on('data', (d) => (logServidor += d))

async function encerrar(codigo) {
  servidor.kill()
  await banco.stop().catch(() => {})
  await db.close().catch(() => {})
  process.exit(codigo)
}

for (let i = 0; ; i++) {
  try {
    if ((await fetch(`${BASE}/saude`)).ok) break
  } catch {}
  if (i > 120) {
    console.error('O servidor de teste não subiu:\n' + logServidor)
    await encerrar(1)
  }
  await new Promise((r) => setTimeout(r, 250))
}

// ------------------------------------------------------------------ ferramentas
async function api(cookie, metodo, caminho, corpo) {
  const r = await fetch(BASE + caminho, {
    method: metodo,
    headers: { ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
  const texto = await r.text()
  let json = null
  try {
    json = JSON.parse(texto)
  } catch {}
  return { status: r.status, json, texto, cookie: r.headers.get('set-cookie')?.split(';')[0] }
}

let passou = 0
let falhou = 0
const falhas = []
let cenarioAtual = ''
function confere(descricao, ok, detalhe = '') {
  if (ok) passou++
  else {
    falhou++
    falhas.push(`${cenarioAtual} — ${descricao}${detalhe ? ` (${detalhe})` : ''}`)
  }
  console.log(`  ${ok ? '✅' : '❌'} ${descricao}${!ok && detalhe ? `  → ${detalhe}` : ''}`)
}
const cenario = (t) => {
  cenarioAtual = t
  console.log(`\n${t}`)
}
const igual = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005
const brl = (n) => Number(n).toFixed(2)

// ------------------------------------------------------------------ padaria fictícia
const id = randomBytes(3).toString('hex')
const dono = (await api(null, 'POST', '/auth/setup', {
  nome: 'Dona Rosa',
  email: `rosa.${id}@teste.local`,
  senha: SENHA,
  aceite_termos: true, padaria: { nome_fantasia: 'Padaria Teste' },
})).cookie
await api(dono, 'POST', '/equipe/membros', { nome: 'Caio Balcão', email: `caio.${id}@teste.local`, senha: SENHA, papel: 'funcionario' })
const func = (await api(null, 'POST', '/auth/login', { email: `caio.${id}@teste.local`, senha: SENHA })).cookie

const criar = async (p) => (await api(dono, 'POST', '/produtos', p)).json.id
const P = {
  pao: await criar({ nome: 'Pão francês', categoria: 'Pães', unidade: 'kg', preco_venda: 20, preco_custo: 8, estoque_atual: 10, estoque_minimo: 2 }),
  coxinha: await criar({ nome: 'Coxinha', categoria: 'Salgados', unidade: 'un', preco_venda: 7.5, preco_custo: 2.5, estoque_atual: 20, estoque_minimo: 5 }),
  cafe: await criar({ nome: 'Café coado', categoria: 'Bebidas', unidade: 'un', preco_venda: 5, preco_custo: 1, estoque_atual: 50, estoque_minimo: 10 }),
  farinha: await criar({ nome: 'Farinha de trigo', categoria: 'Ingredientes', unidade: 'kg', preco_venda: 0, preco_custo: 4, estoque_atual: 25, estoque_minimo: 5 }),
  bolo: await criar({ nome: 'Bolo de cenoura', categoria: 'Bolos', unidade: 'un', preco_venda: 30, preco_custo: 10, estoque_atual: 5, estoque_minimo: 1 }),
}
const estoque = async (produtoId) =>
  Number((await api(dono, 'GET', '/produtos')).json.find((p) => p.id === produtoId)?.estoque_atual)
const vender = (cookie, itens, forma, extra = {}) => api(cookie, 'POST', '/vendas', { itens, forma_pagamento: forma, ...extra })

console.log('🧪 Teste funcional do Coffee Break (banco temporário, dados fictícios)')

// ------------------------------------------------------------------ 1
cenario('1. Abrir o caixa')
let r = await api(dono, 'POST', '/caixa/abrir', { fundo_troco: 100 })
confere('caixa aberto com fundo de troco de R$ 100', r.status === 201, `status ${r.status}`)
r = await api(dono, 'POST', '/caixa/abrir', { fundo_troco: 50 })
confere('não abre um segundo caixa para a mesma pessoa', r.status >= 400 && r.status < 500, `status ${r.status}`)

// ------------------------------------------------------------------ 2
cenario('2. Venda simples no Pix')
const vendaPix = await vender(dono, [{ produto_id: P.coxinha, quantidade: 2 }], 'pix')
confere('venda registrada', vendaPix.status === 201, `status ${vendaPix.status}`)
confere('total = 2 × R$ 7,50 = R$ 15,00', igual(vendaPix.json?.total, 15), `total ${vendaPix.json?.total}`)
confere('estoque da coxinha baixou de 20 para 18', igual(await estoque(P.coxinha), 18), `estoque ${await estoque(P.coxinha)}`)

// ------------------------------------------------------------------ 3
cenario('3. Venda por quilo, em dinheiro')
r = await vender(dono, [{ produto_id: P.pao, quantidade: 0.5 }], 'dinheiro', { valor_recebido: 20 })
confere('0,5 kg × R$ 20,00 = R$ 10,00', r.status === 201 && igual(r.json?.total, 10), `${r.status} total ${r.json?.total}`)
confere('estoque do pão baixou de 10 para 9,5 kg', igual(await estoque(P.pao), 9.5), `estoque ${await estoque(P.pao)}`)

// ------------------------------------------------------------------ 4
cenario('4. Promoções automáticas')
r = await api(dono, 'POST', '/promocoes', { nome: 'Café 10%', tipo: 'percentual', valor: 10, abrangencia: 'categorias', alvos: ['Bebidas'], ativa: true })
confere('promoção de 10% em Bebidas criada', r.status === 201, `status ${r.status}`)
r = await api(dono, 'POST', '/promocoes', { nome: 'Leve 3 pague 2', tipo: 'leve_pague', leve: 3, pague: 2, abrangencia: 'produtos', alvos: [P.coxinha], ativa: true })
confere('promoção leve 3 pague 2 na coxinha criada', r.status === 201, `status ${r.status}`)
r = await vender(dono, [{ produto_id: P.cafe, quantidade: 2 }], 'cartao_debito')
confere('2 cafés com 10%: R$ 10,00 − R$ 1,00 = R$ 9,00', igual(r.json?.total, 9) && igual(r.json?.desconto_promocoes, 1), `total ${r.json?.total} desc ${r.json?.desconto_promocoes}`)
r = await vender(dono, [{ produto_id: P.coxinha, quantidade: 3 }], 'cartao_credito')
confere('3 coxinhas no leve 3 pague 2 = R$ 15,00', igual(r.json?.total, 15), `total ${r.json?.total}`)
r = await api(dono, 'POST', '/promocoes', { nome: 'Inválida', tipo: 'percentual', valor: 150, abrangencia: 'tudo' })
confere('promoção de 150% é recusada', r.status === 400, `status ${r.status}`)

// ------------------------------------------------------------------ 5
cenario('5. Desconto manual e limite do funcionário')
r = await vender(func, [{ produto_id: P.cafe, quantidade: 1 }], 'pix', { desconto_manual: { tipo: 'percentual', valor: 5 } })
confere('funcionário dá 5% de desconto', r.status === 201 && Number(r.json?.total) < 4.5, `${r.status} total ${r.json?.total}`)
r = await vender(func, [{ produto_id: P.cafe, quantidade: 1 }], 'pix', { desconto_manual: { tipo: 'percentual', valor: 20 } })
confere('funcionário NÃO dá 20% (só gerente ou dono)', r.status === 403, `status ${r.status}`)
const vendaDesconto = await vender(dono, [{ produto_id: P.coxinha, quantidade: 1 }], 'pix', { desconto_manual: { tipo: 'percentual', valor: 20 } })
confere('dono dá 20%: R$ 7,50 → R$ 6,00', igual(vendaDesconto.json?.total, 6), `total ${vendaDesconto.json?.total}`)

// ------------------------------------------------------------------ 6
cenario('6. Vendas inválidas')
r = await vender(dono, [], 'pix')
confere('pedido vazio é recusado', r.status === 400, `status ${r.status}`)
r = await vender(dono, [{ produto_id: P.coxinha, quantidade: 0 }], 'pix')
confere('quantidade zero é recusada', r.status === 400, `status ${r.status}`)
r = await vender(dono, [{ produto_id: 'nao-existe', quantidade: 1 }], 'pix')
confere('produto inexistente é recusado', r.status === 400, `status ${r.status}`)
r = await vender(dono, [{ produto_id: P.coxinha, quantidade: 1 }], 'cheque')
confere('forma de pagamento inválida é recusada', r.status === 400, `status ${r.status}`)

// ------------------------------------------------------------------ 7
cenario('7. Devolução')
r = await api(func, 'POST', `/vendas/${vendaPix.json.id}/devolver`, { motivo: 'Cliente desistiu' })
confere('funcionário não devolve venda', r.status === 403, `status ${r.status}`)
r = await api(dono, 'POST', `/vendas/${vendaPix.json.id}/devolver`, { motivo: '' })
confere('devolução sem motivo é recusada', r.status === 400, `status ${r.status}`)
const antesDevolver = await estoque(P.coxinha)
r = await api(dono, 'POST', `/vendas/${vendaPix.json.id}/devolver`, { motivo: 'Cliente desistiu' })
confere('dono devolve a venda', r.status < 300, `status ${r.status}`)
confere('estoque das 2 coxinhas voltou', igual(await estoque(P.coxinha), antesDevolver + 2), `${antesDevolver} → ${await estoque(P.coxinha)}`)
r = await api(dono, 'GET', `/vendas/${vendaPix.json.id}`)
confere('venda aparece como devolvida', r.json?.status === 'devolvida', `status ${r.json?.status}`)
r = await api(dono, 'POST', `/vendas/${vendaPix.json.id}/devolver`, { motivo: 'De novo' })
confere('não devolve a mesma venda duas vezes', r.status >= 400 && r.status < 500, `status ${r.status}`)

// ------------------------------------------------------------------ 8
cenario('8. Estoque: entrada, ajuste e saída')
const base = await estoque(P.coxinha)
r = await api(dono, 'POST', '/estoque/movimentacoes', { produto_id: P.coxinha, tipo: 'entrada', quantidade: 5, motivo: 'Fornada' })
confere('entrada de 5 unidades soma no estoque', igual(await estoque(P.coxinha), base + 5), `${base} → ${await estoque(P.coxinha)}`)
r = await api(dono, 'POST', '/estoque/movimentacoes', { produto_id: P.coxinha, tipo: 'ajuste', quantidade: 7, motivo: 'Contagem' })
confere('ajuste deixa o estoque exatamente em 7', igual(await estoque(P.coxinha), 7), `estoque ${await estoque(P.coxinha)}`)
r = await api(dono, 'POST', '/estoque/movimentacoes', { produto_id: P.coxinha, tipo: 'entrada', quantidade: -3 })
confere('entrada negativa é recusada', r.status === 400, `status ${r.status}`)

// ------------------------------------------------------------------ 9
cenario('9. Encomenda com sinal e entrega')
const amanha = new Date(Date.now() + 24 * 3600e3).toISOString()
r = await api(dono, 'POST', '/encomendas', { cliente_nome: 'Lia', cliente_telefone: '11988887777', retirada_em: amanha, itens: [{ produto_id: P.bolo, quantidade: 2, preco_unitario: 30 }], sinal: 20, forma_sinal: 'pix' })
const encomenda = r.json
confere('encomenda de 2 bolos = R$ 60,00 com sinal de R$ 20,00', r.status === 201 && igual(encomenda?.total, 60), `${r.status} total ${encomenda?.total}`)
r = await api(dono, 'POST', '/encomendas', { cliente_nome: 'Exagerado', retirada_em: amanha, itens: [{ produto_id: P.bolo, quantidade: 1, preco_unitario: 30 }], sinal: 40, forma_sinal: 'pix' })
confere('sinal maior que o total é recusado', r.status === 400, `status ${r.status}`)
for (const status of ['confirmada', 'em_producao', 'pronta']) {
  r = await api(dono, 'POST', `/encomendas/${encomenda.id}/status`, { status })
  confere(`muda para "${status}"`, r.status < 300, `status ${r.status}`)
}
r = await api(dono, 'POST', `/encomendas/${encomenda.id}/entregar`, { forma_pagamento: 'dinheiro', valor_recebido: 30 })
confere('recebido menor que o restante (R$ 40) é recusado', r.status === 400, `status ${r.status}`)
const estoqueBolo = await estoque(P.bolo)
r = await api(dono, 'POST', `/encomendas/${encomenda.id}/entregar`, { forma_pagamento: 'dinheiro', valor_recebido: 50 })
confere('entrega registra a venda', r.status < 300 && r.json?.venda_id, `status ${r.status}`)
confere('estoque dos bolos baixou 2', igual(await estoque(P.bolo), estoqueBolo - 2), `${estoqueBolo} → ${await estoque(P.bolo)}`)
r = await api(dono, 'POST', `/encomendas/${encomenda.id}/entregar`, { forma_pagamento: 'dinheiro', valor_recebido: 50 })
confere('não entrega a mesma encomenda duas vezes', r.status >= 400 && r.status < 500, `status ${r.status}`)

// ------------------------------------------------------------------ 10
cenario('10. Sangria, suprimento e fechamento do caixa')
r = await api(dono, 'POST', '/caixa/movimento', { tipo: 'sangria', valor: 30, motivo: 'Cofre' })
confere('sangria de R$ 30 registrada', r.status === 204, `status ${r.status}`)
r = await api(dono, 'POST', '/caixa/movimento', { tipo: 'suprimento', valor: 10, motivo: 'Troco' })
confere('suprimento de R$ 10 registrado', r.status === 204, `status ${r.status}`)
// Na gaveta: fundo 100 + dinheiro 10 (pão) + 40 (restante da encomenda) + 10 − 30 = 130.
// Pix: 6 (venda com desconto) + 20 (sinal) = 26 — a venda de 15 devolvida não conta.
r = await api(dono, 'POST', '/caixa/fechar', { contado: { dinheiro: 125 } })
confere('dinheiro esperado na gaveta = R$ 130,00', igual(r.json?.esperado?.dinheiro, 130), `esperado ${r.json?.esperado?.dinheiro}`)
confere('Pix esperado = R$ 26,00 (sem a venda devolvida; sinal contado uma vez)', igual(r.json?.esperado?.pix, 26), `pix ${r.json?.esperado?.pix}`)
confere('cartão: débito R$ 9,00 e crédito R$ 15,00', igual(r.json?.esperado?.cartao_debito, 9) && igual(r.json?.esperado?.cartao_credito, 15), `${r.json?.esperado?.cartao_debito} / ${r.json?.esperado?.cartao_credito}`)
confere('contou R$ 125,00: diferença de −R$ 5,00', igual(r.json?.diferenca, -5), `diferença ${r.json?.diferenca}`)
r = await api(dono, 'POST', '/caixa/fechar', { contado: { dinheiro: 0 } })
confere('não fecha um caixa já fechado', r.status === 409, `status ${r.status}`)

// ------------------------------------------------------------------ 11
cenario('11. Receita e produção')
r = await api(dono, 'POST', '/receitas', { produto_id: P.pao, nome: 'Pão francês (fornada)', rendimento: 10, itens: [{ ingrediente_id: P.farinha, quantidade: 6 }] })
confere('ficha técnica criada (10 kg de pão com 6 kg de farinha)', r.status === 201, `status ${r.status}`)
const receitaId = r.json?.id
const hoje = new Date().toISOString().slice(0, 10)
r = await api(dono, 'POST', '/producoes', { receita_id: receitaId, data: hoje })
const producaoId = r.json?.id
confere('produção planejada para hoje', r.status === 201, `status ${r.status}`)
const paoAntes = await estoque(P.pao)
const farinhaAntes = await estoque(P.farinha)
r = await api(func, 'POST', `/producoes/${producaoId}/concluir`)
confere('produção concluída', r.status < 300, `status ${r.status}`)
confere('pão pronto +10 kg no estoque', igual(await estoque(P.pao), paoAntes + 10), `${paoAntes} → ${await estoque(P.pao)}`)
confere('farinha −6 kg no estoque', igual(await estoque(P.farinha), farinhaAntes - 6), `${farinhaAntes} → ${await estoque(P.farinha)}`)
r = await api(dono, 'POST', `/producoes/${producaoId}/concluir`)
confere('não conclui a mesma produção duas vezes', r.status >= 400 && r.status < 500, `status ${r.status}`)

// ------------------------------------------------------------------ 12
cenario('12. Perdas do dia')
const paoAntesPerda = await estoque(P.pao)
r = await api(func, 'POST', '/perdas', { itens: [{ produto_id: P.pao, quantidade: 1 }], motivo: 'sobra' })
confere('sobra de 1 kg registrada', r.status < 300, `status ${r.status}`)
confere('estoque do pão −1 kg', igual(await estoque(P.pao), paoAntesPerda - 1), `${paoAntesPerda} → ${await estoque(P.pao)}`)
r = await api(func, 'POST', '/perdas', { itens: [{ produto_id: P.pao, quantidade: 1 }], motivo: 'roubo' })
confere('motivo fora da lista é recusado', r.status === 400, `status ${r.status}`)

// ------------------------------------------------------------------ 13
cenario('13. Metas')
r = await api(dono, 'PUT', '/metas', { alvo: 'geral', dia: 10000, semana: 1, mes: 1 })
confere('semana menor que o dia é recusada, com mensagem clara', r.status === 400 && /semana/.test(r.json?.message ?? ''), r.json?.message)
r = await api(dono, 'PUT', '/metas', { alvo: 'geral', dia: 500, semana: null, mes: 300 })
confere('mês menor que o dia é recusado (mesmo com semana em branco)', r.status === 400, `status ${r.status}`)
r = await api(dono, 'PUT', '/metas', { alvo: 'geral', dia: 500, semana: 3500, mes: 15000 })
confere('metas coerentes são salvas', r.status === 204, `status ${r.status}`)
// O navegador manda o início do dia, da semana e do mês no fuso de quem está usando.
const inicio = new Date(); inicio.setHours(0, 0, 0, 0)
const q = new URLSearchParams({ dia: inicio.toISOString(), semana: new Date(inicio - inicio.getDay() * 864e5).toISOString(), mes: new Date(inicio.getFullYear(), inicio.getMonth(), 1).toISOString() })
r = await api(dono, 'GET', '/metas?' + q)
confere('painel mostra a meta do dia de R$ 500,00', igual(r.json?.geral?.dia?.meta, 500), `meta ${r.json?.geral?.dia?.meta}`)
r = await api(func, 'PUT', '/metas', { alvo: 'geral', dia: 1, semana: 7, mes: 30 })
confere('funcionário não define metas', r.status === 403, `status ${r.status}`)

// ------------------------------------------------------------------ 14
cenario('14. Minha padaria: logo e comprovante')
const atual = (await api(dono, 'GET', '/padaria')).json
const logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
r = await api(dono, 'PUT', '/padaria', { ...atual, logo, comprovante: { cor: 'vinho', titulo: 'Seu pedido', mensagem_extra: 'Wi-Fi: Teste123', mostrar: { horario: true, cnpj: false } } })
confere('logo e comprovante personalizado salvos', r.status === 200, `status ${r.status} ${r.json?.message ?? ''}`)
r = await api(dono, 'GET', '/padaria')
confere('logo volta igual ao que foi enviado', r.json?.logo === logo)
confere('opções do comprovante voltam salvas', r.json?.comprovante?.cor === 'vinho' && r.json?.comprovante?.titulo === 'Seu pedido' && r.json?.comprovante?.mostrar?.cnpj === false, JSON.stringify(r.json?.comprovante))
r = await api(dono, 'PUT', '/padaria', { ...atual, logo: 'javascript:alert(1)' })
confere('logo que não é imagem é recusada', r.status === 400, `status ${r.status}`)
r = await api(dono, 'PUT', '/padaria', { ...atual, comprovante: { cor: 'neon' } })
confere('cor fora da lista é recusada', r.status === 400, `status ${r.status}`)
r = await api(dono, 'PUT', '/padaria', { ...atual, comprovante: { titulo: 'x'.repeat(41) } })
confere('título com mais de 40 letras é recusado', r.status === 400, `status ${r.status}`)
r = await api(func, 'GET', '/padaria')
confere('funcionário vê a logo (menu e comprovante)', r.status === 200 && r.json?.logo === logo, `status ${r.status}`)

// ------------------------------------------------------------------ 15
cenario('15. Termos, privacidade, contrato e direitos do titular (LGPD)')
r = await api(null, 'POST', '/auth/setup', { nome: 'Sem Aceite', email: `semaceite.${id}@teste.local`, senha: SENHA, padaria: { nome_fantasia: 'X' } })
confere('criar padaria sem aceitar os termos é recusado', r.status === 400 && /Termos/.test(r.json?.message ?? ''), r.json?.message)
r = await api(null, 'POST', '/auth/cadastro', { nome: 'Sem Aceite', email: `semaceite2.${id}@teste.local`, senha: SENHA, codigo: 'ABCDEFGH' })
confere('criar conta de funcionário sem aceitar os termos é recusado', r.status === 400, `status ${r.status}`)
r = await api(dono, 'GET', '/legal/termos')
confere('dono que aceitou no cadastro não tem pendência', r.status === 200 && r.json?.pendente === false && r.json?.aceito_em, JSON.stringify(r.json))
r = await api(func, 'GET', '/legal/termos')
confere('funcionário cadastrado pelo dono precisa aceitar no primeiro acesso', r.json?.pendente === true, JSON.stringify(r.json))
r = await api(func, 'POST', '/legal/termos', { aceite: false })
confere('aceite desmarcado é recusado', r.status === 400, `status ${r.status}`)
r = await api(func, 'POST', '/legal/termos', { aceite: true })
confere('funcionário aceita os termos', r.status === 204, `status ${r.status}`)
r = await api(func, 'GET', '/legal/termos')
confere('aceite registrado com data e versão', r.json?.pendente === false && r.json?.versao_aceita === r.json?.versao_atual && r.json?.aceito_em, JSON.stringify(r.json))
r = await api(func, 'GET', '/legal/meus-dados')
confere('"Baixar meus dados" traz o perfil e os registros de acesso', r.status === 200 && r.json?.perfil?.email?.startsWith('caio.') && Array.isArray(r.json?.registros_de_acesso), `status ${r.status}`)
confere('o arquivo não traz senha nem hash', !/senha|\$2[aby]\$/.test(r.texto))
confere('o arquivo não traz dados de outras pessoas', !r.texto.includes(`rosa.${id}`))
r = await api(null, 'GET', '/legal/meus-dados')
confere('sem login não baixa dados de ninguém', r.status === 401, `status ${r.status}`)

r = await api(dono, 'GET', '/legal/contrato')
confere('dono novo tem o contrato pendente de assinatura', r.json?.pendente === true && r.json?.hash?.length === 64, JSON.stringify(r.json))
const { createHash } = await import('node:crypto')
const { readFileSync } = await import('node:fs')
const hashEsperado = createHash('sha256').update(readFileSync('src/features/legal/contrato.txt', 'utf8').replace(/\r\n/g, '\n').trim(), 'utf8').digest('hex')
confere('o hash do contrato é o do texto exato mostrado no site', r.json?.hash === hashEsperado)
r = await api(func, 'GET', '/legal/contrato')
confere('funcionário não tem contrato para assinar', r.json?.pendente === false, JSON.stringify(r.json))
r = await api(func, 'POST', '/legal/contrato', { nome: 'Caio Balcão', aceite: true })
confere('funcionário não assina o contrato da padaria', r.status === 403, `status ${r.status}`)
r = await api(dono, 'POST', '/legal/contrato', { nome: 'Outra Pessoa', aceite: true })
confere('assinar com nome diferente do da conta é recusado', r.status === 400 && /Dona Rosa/.test(r.json?.message ?? ''), r.json?.message)
r = await api(dono, 'POST', '/legal/contrato', { nome: 'Dona Rosa', aceite: false })
confere('assinar sem concordar é recusado', r.status === 400, `status ${r.status}`)
r = await api(dono, 'POST', '/legal/contrato', { nome: '  dona   ROSA ', aceite: true })
confere('dono assina (nome igual, ignorando maiúsculas e espaços)', r.status === 201 && r.json?.hash_contrato === hashEsperado && r.json?.assinado_em, `status ${r.status}`)
r = await api(dono, 'GET', '/legal/contrato')
confere('depois de assinar, não há mais pendência', r.json?.pendente === false && r.json?.assinatura?.nome_assinado, JSON.stringify(r.json))
r = await api(dono, 'GET', '/legal/meus-dados')
confere('a assinatura aparece em "Baixar meus dados" com IP e data', r.json?.contratos_assinados?.length === 1 && 'ip' in r.json.contratos_assinados[0], JSON.stringify(r.json?.contratos_assinados))
confere('o histórico de aceites aparece em "Baixar meus dados"', r.json?.aceites_dos_termos?.length >= 2, JSON.stringify(r.json?.aceites_dos_termos))

// Provas guardadas no banco: texto inteiro de cada versão, histórico de aceites, nada se altera.
const docs = (await db.query('select tipo, hash, texto from padaria.documentos_legais')).rows
const docContrato = docs.find((d) => d.tipo === 'contrato' && d.hash === hashEsperado)
confere('o texto inteiro do contrato assinado fica guardado no banco', docContrato?.texto === readFileSync('src/features/legal/contrato.txt', 'utf8').replace(/\r\n/g, '\n').trim())
confere('o texto dos Termos e da Política também fica guardado', docs.some((d) => d.tipo === 'termos' && /Termos de Uso/.test(d.texto)) && docs.some((d) => d.tipo === 'privacidade' && /LGPD/.test(d.texto)), docs.map((d) => d.tipo).join(','))
confere('os dados da contratada ficam no fim do contrato', /DADOS DA CONTRATADA\n\n[^\n]*63\.702\.108\/0001-46[^\n]*$/.test(docContrato?.texto ?? ''))
const aceitesDono = (await db.query(`select origem, hash_termos, nome from padaria.aceites_termos where email like 'rosa.%' order by aceito_em`)).rows
confere('aceites do dono no histórico: criação da padaria e contrato', aceitesDono.map((a) => a.origem).join(',') === 'primeiro-acesso,contrato', JSON.stringify(aceitesDono))
confere('cada aceite aponta para um texto guardado', aceitesDono.every((a) => docs.some((d) => d.tipo === 'termos' && d.hash === a.hash_termos)))
const aceitesFunc = (await db.query(`select origem, ip from padaria.aceites_termos where email like 'caio.%'`)).rows
confere('novo aceite do funcionário fica no histórico, com IP', aceitesFunc.some((a) => a.origem === 'novo-aceite' && a.ip), JSON.stringify(aceitesFunc))
const assinaturaBanco = (await db.query(`select email_conta, padaria_nome from padaria.assinaturas_contrato where email_conta like 'rosa.%'`)).rows[0]
confere('a assinatura guarda o e-mail e o nome da padaria da época', assinaturaBanco?.email_conta && assinaturaBanco?.padaria_nome, JSON.stringify(assinaturaBanco))
// Abuso: repetir o aceite ou a assinatura não pode encher o banco (as linhas não se apagam).
const contar = async (tabela) => (await db.query(`select count(*)::int as n from padaria.${tabela}`)).rows[0].n
const aceitesAntes = await contar('aceites_termos')
for (let i = 0; i < 5; i++) await api(func, 'POST', '/legal/termos', { aceite: true })
confere('repetir o aceite não grava linhas novas', (await contar('aceites_termos')) === aceitesAntes)
const assinaturasAntes = await contar('assinaturas_contrato')
r = await api(dono, 'POST', '/legal/contrato', { nome: 'Dona Rosa', aceite: true })
confere('assinar de novo o mesmo texto devolve a assinatura existente', r.status === 200 && r.json?.hash_contrato === hashEsperado && (await contar('assinaturas_contrato')) === assinaturasAntes, `status ${r.status}`)
const recusa = async (sql) => db.query(sql).then(() => false, (e) => /Registro legal/.test(e.message))
confere('o banco recusa alterar uma assinatura', await recusa(`update padaria.assinaturas_contrato set nome_assinado = 'Outro'`))
confere('o banco recusa apagar uma assinatura', await recusa('delete from padaria.assinaturas_contrato'))
confere('o banco recusa apagar o histórico de aceites', await recusa('delete from padaria.aceites_termos'))
confere('o banco recusa alterar o texto guardado', await recusa(`update padaria.documentos_legais set texto = 'x'`))

cenario('16. Central de dúvidas: notícias e novidades')
r = await api(null, 'GET', '/ajuda/noticias')
confere('sem login não vê as notícias', r.status === 401, `status ${r.status}`)
r = await api(func, 'GET', '/ajuda/noticias')
confere('notícias respondem com uma lista (vazia se a internet falhar)', r.status === 200 && Array.isArray(r.json?.itens), `status ${r.status}`)
r = await api(func, 'GET', '/ajuda/novidades')
confere('novidades respondem com uma lista', r.status === 200 && Array.isArray(r.json?.itens), `status ${r.status}`)
const { lerRss, destaquesDaRelease } = await import('../server/ajuda.ts')
const rss = `<rss><channel>
<item><title>Padarias crescem 8% - Jornal do Pão</title><link>https://exemplo.com/a</link><pubDate>Mon, 02 Nov 2026 10:00:00 GMT</pubDate><source url="https://exemplo.com">Jornal do Pão</source></item>
<item><title><![CDATA[Golpe <b>perigoso</b> &amp; falso]]></title><link>javascript:alert(1)</link><source>Mal</source></item>
<item><title>Preço do trigo &#233; destaque</title><link>https://exemplo.com/b</link><source>Agro</source></item>
</channel></rss>`
const lidas = lerRss(rss)
confere('RSS: título sem o nome da fonte repetido', lidas[0]?.titulo === 'Padarias crescem 8%' && lidas[0]?.fonte === 'Jornal do Pão', JSON.stringify(lidas[0]))
confere('RSS: link javascript: é descartado', lidas.length === 2 && lidas.every((n) => n.link.startsWith('https://')), JSON.stringify(lidas))
confere('RSS: entidades HTML viram texto', lidas[1]?.titulo === 'Preço do trigo é destaque', lidas[1]?.titulo)
confere('release: destaques sem marcação Markdown', JSON.stringify(destaquesDaRelease('## Título\n- **Novo** recurso `x`\n- Veja [aqui](https://a.b)\ntexto')) === JSON.stringify(['Novo recurso x', 'Veja aqui']))

// ------------------------------------------------------------------ resultado
console.log(`\n${'─'.repeat(60)}`)
console.log(`Resultado: ${passou} passaram, ${falhou} falharam`)
if (falhou) {
  console.log('\nFalhas:')
  for (const f of falhas) console.log(`  ❌ ${f}`)
}
await encerrar(falhou ? 1 : 0)
