// Guia e dicas: notícias do setor de padarias (Google Notícias, RSS público) e novidades do
// Coffee Break (releases do GitHub). O servidor busca, guarda por 1 hora e devolve só título,
// fonte, data e link — nada da pessoa logada vai para esses serviços.
import { Router } from 'express'

export const ajudaRouter = Router()

type Noticia = { titulo: string; fonte: string; link: string; publicada_em: string | null }
type Novidade = { versao: string; titulo: string; publicada_em: string; destaques: string[]; link: string }

const UMA_HORA = 60 * 60 * 1000
const BUSCA_NOTICIAS = 'padaria OR panificação OR confeitaria OR "setor de panificação"'
const URL_NOTICIAS = `https://news.google.com/rss/search?q=${encodeURIComponent(BUSCA_NOTICIAS)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`
const URL_RELEASES = 'https://api.github.com/repos/EvandroOdairCagniniJr/Coffee-Break/releases?per_page=8'

const cache = new Map<string, { ate: number; dados: unknown }>()

async function emCache<T>(chave: string, buscar: () => Promise<T>, vazio: T): Promise<T> {
  const atual = cache.get(chave)
  if (atual && atual.ate > Date.now()) return atual.dados as T
  try {
    const dados = await buscar()
    cache.set(chave, { ate: Date.now() + UMA_HORA, dados })
    return dados
  } catch (err) {
    console.warn(`Ajuda: não deu para buscar ${chave}:`, (err as Error).message)
    // Sem internet ou serviço fora: usa o último resultado, ou lista vazia (tenta de novo em 5 min).
    if (atual) return atual.dados as T
    cache.set(chave, { ate: Date.now() + 5 * 60 * 1000, dados: vazio })
    return vazio
  }
}

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
function textoLimpo(bruto: string) {
  return bruto
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === '#') {
        const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
        return Number.isFinite(n) ? String.fromCodePoint(n) : m
      }
      return ENTIDADES[e.toLowerCase()] ?? m
    })
    .replace(/\s+/g, ' ')
    .trim()
}

// Só links http(s): nada de javascript: ou data: vindo de fora.
function linkSeguro(url: string) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch {
    return null
  }
}

function campo(item: string, nome: string) {
  const m = item.match(new RegExp(`<${nome}[^>]*>([\\s\\S]*?)</${nome}>`, 'i'))
  return m ? textoLimpo(m[1]) : ''
}

export function lerRss(xml: string, limite = 8): Noticia[] {
  const itens = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []
  const noticias: Noticia[] = []
  for (const item of itens) {
    const fonte = campo(item, 'source')
    let titulo = campo(item, 'title')
    // O Google Notícias termina o título com " - Fonte": a fonte já aparece separada.
    if (fonte && titulo.endsWith(` - ${fonte}`)) titulo = titulo.slice(0, -(fonte.length + 3))
    const link = linkSeguro(campo(item, 'link'))
    if (!titulo || !link) continue
    const data = new Date(campo(item, 'pubDate'))
    noticias.push({
      titulo: titulo.slice(0, 220),
      fonte: fonte.slice(0, 80),
      link,
      publicada_em: Number.isNaN(data.getTime()) ? null : data.toISOString(),
    })
    if (noticias.length >= limite) break
  }
  return noticias
}

// Da release em Markdown, pega os primeiros itens de lista como destaques, sem a marcação.
export function destaquesDaRelease(corpo: string, limite = 4) {
  return corpo
    .split('\n')
    .filter((l) => /^\s*[-*]\s+/.test(l))
    .map((l) =>
      l
        .replace(/^\s*[-*]\s+/, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim(),
    )
    .filter(Boolean)
    .slice(0, limite)
    .map((l) => l.slice(0, 200))
}

async function buscarComPrazo(url: string, cabecalhos: Record<string, string> = {}) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'CoffeeBreak/1.0 (+https://padaria-info.onrender.com)', ...cabecalhos },
    signal: AbortSignal.timeout(6000),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r
}

ajudaRouter.get('/noticias', async (_req, res) => {
  const itens = await emCache(
    'noticias',
    async () => lerRss(await (await buscarComPrazo(URL_NOTICIAS)).text()),
    [] as Noticia[],
  )
  res.json({ itens, fonte: 'Google Notícias' })
})

ajudaRouter.get('/novidades', async (_req, res) => {
  const itens = await emCache(
    'novidades',
    async () => {
      const lista = (await (await buscarComPrazo(URL_RELEASES, { Accept: 'application/vnd.github+json' })).json()) as {
        tag_name: string
        name: string | null
        published_at: string
        body: string | null
        html_url: string
        draft: boolean
      }[]
      return lista
        .filter((r) => !r.draft)
        .map(
          (r): Novidade => ({
            versao: r.tag_name.slice(0, 20),
            titulo: (r.name ?? r.tag_name).replace(/^v[\d.]+\s*[—-]\s*/, '').slice(0, 140),
            publicada_em: r.published_at,
            destaques: destaquesDaRelease(r.body ?? ''),
            link: linkSeguro(r.html_url) ?? 'https://github.com/EvandroOdairCagniniJr/Coffee-Break/releases',
          }),
        )
    },
    [] as Novidade[],
  )
  res.json({ itens })
})
