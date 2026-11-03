// Servidor do Coffee Break: API em /api e o site (pasta dist) no mesmo endereço.
// Rodar com `npm start` (gera o build e sobe o servidor) ou `npm run server`.
import { existsSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import { fileURLToPath } from 'node:url'

if (existsSync('.env')) process.loadEnvFile('.env')

const { default: express } = await import('express')
const { default: cookieParser } = await import('cookie-parser')
const { default: compression } = await import('compression')
// Importados depois do loadEnvFile: db.ts e auth.ts leem process.env ao carregar.
const { initDatabase, pool } = await import('./db.ts')
const { authRouter, exigirLogin, exigirPadariaLiberada } = await import('./auth.ts')
const { apiRouter } = await import('./routes.ts')
const { equipeRouter } = await import('./equipe.ts')
const { timeRouter } = await import('./time.ts')
const { padariaRouter } = await import('./padaria.ts')
const { metasRouter } = await import('./metas.ts')
const { perdasRouter } = await import('./perdas.ts')
const { encomendasRouter } = await import('./encomendas.ts')
const { caixaRouter } = await import('./caixa.ts')
const { margensRouter } = await import('./margens.ts')
const { recomendacoesRouter } = await import('./recomendacoes.ts')
const { analiseRouter } = await import('./analise.ts')
const { promocoesRouter } = await import('./promocoes.ts')
const { legalRouter, registrarDocumentosLegais } = await import('./legal.ts')
const { ajudaRouter } = await import('./ajuda.ts')
const { liberacaoRouter } = await import('./liberacao.ts')
const { plataformaRouter } = await import('./plataforma.ts')
const { errorHandler } = await import('./http.ts')
const { agendarLimpeza, cabecalhosSeguranca, limiteGeral, mesmaOrigem, semCache } = await import(
  './seguranca.ts'
)
const { assetsComprimidos } = await import('./estaticos.ts')

const port = Number(process.env.PORT ?? 3000)

try {
  await initDatabase()
  await registrarDocumentosLegais()
} catch (err) {
  console.error('\nNão foi possível conectar ao banco:', (err as Error).message)
  console.error('Confira o DATABASE_URL no arquivo .env (connection string do Supabase).\n')
  process.exit(1)
}
agendarLimpeza()

const app = express()
// Atrás do proxy do Render (HTTPS): IP real do cliente e cookie seguro.
app.set('trust proxy', 1)
// Não anuncia que o servidor é Express.
app.disable('x-powered-by')
app.use(cabecalhosSeguranca)
app.use(compression())
// Limite maior por causa das fotos da equipe (já reduzidas no navegador).
const jsonPadrao = express.json({ limit: '1mb', strict: true })
// O envio de documentos da liberação tem limite próprio, maior (server/liberacao.ts).
app.use((req, res, next) => (req.path === '/api/liberacao/documentos' ? next() : jsonPadrao(req, res, next)))
app.use(cookieParser())

// Verificação de saúde do Render (sem login).
app.get('/api/saude', (_req, res) => {
  res.json({ ok: true })
})
app.use('/api', semCache, limiteGeral, mesmaOrigem)
// "Cutucada" do GitHub Actions (.github/workflows/manter-acordado.yml): mantém o Render acordado
// e faz uma consulta mínima no banco, para o Supabase grátis não pausar o projeto por inatividade.
app.get('/api/saude/banco', async (_req, res) => {
  try {
    await pool.query('select 1')
    res.json({ ok: true })
  } catch {
    res.status(503).json({ ok: false })
  }
})
app.use('/api/auth', authRouter)
// Logado E com a padaria liberada pela administração. Contrato, termos e a tela de liberação
// funcionam antes disso; a administração da plataforma responde 404 para quem não é dela.
const liberada = [exigirLogin, exigirPadariaLiberada]
app.use('/api/liberacao', exigirLogin, liberacaoRouter)
app.use('/api/plataforma', exigirLogin, plataformaRouter)
app.use('/api/equipe', liberada, equipeRouter)
app.use('/api/time', liberada, timeRouter)
app.use('/api/padaria', liberada, padariaRouter)
app.use('/api/metas', liberada, metasRouter)
app.use('/api/encomendas', liberada, encomendasRouter)
app.use('/api/caixa', liberada, caixaRouter)
app.use('/api/margens', liberada, margensRouter)
app.use('/api/recomendacoes', liberada, recomendacoesRouter)
app.use('/api/analise', liberada, analiseRouter)
app.use('/api/promocoes', liberada, promocoesRouter)
app.use('/api/legal', exigirLogin, legalRouter)
app.use('/api/ajuda', liberada, ajudaRouter)
app.use('/api', liberada, perdasRouter)
app.use('/api', liberada, apiRouter)
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' })
})
app.use(errorHandler)

const dist = fileURLToPath(new URL('../dist', import.meta.url))
if (existsSync(dist)) {
  // /assets tem hash no nome: o navegador guarda por 1 ano e não pergunta de novo.
  app.use('/assets', assetsComprimidos(`${dist}/assets`))
  app.use('/assets', express.static(`${dist}/assets`, { immutable: true, maxAge: '1y' }))
  app.use(express.static(dist))
  // Rotas do React Router (/estoque, /pdv...) devolvem o app.
  app.get(/.*/, (_req, res) => res.sendFile('index.html', { root: dist }))
}

// Sem host = IPv4 e IPv6. Escutar só em 0.0.0.0 fazia o navegador tentar o IPv6 de
// "localhost" primeiro e esperar ~200 ms (ou segundos) em cada conexão no Windows.
app.listen(port, () => {
  console.log(`\nCoffee Break rodando em http://localhost:${port}`)
  const ips = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => `http://${i!.address}:${port}`)
  if (ips.length) console.log(`Na rede da padaria: ${ips.join('  ')}`)
  if (!existsSync(dist)) console.log('(pasta dist não encontrada — rode `npm run build` para servir o site)')
})
