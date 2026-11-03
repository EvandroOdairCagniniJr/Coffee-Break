import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Newspaper, Rocket } from 'lucide-react'
import { api } from '@/lib/api'
import { tempoRelativo } from '@/lib/format'

type Noticia = { titulo: string; fonte: string; link: string; publicada_em: string | null }
type Novidade = { versao: string; titulo: string; publicada_em: string; destaques: string[]; link: string }

const MEIA_HORA = 30 * 60 * 1000

// Novidades do Coffee Break (o que foi lançado) e notícias do setor de padarias.
export function NovidadesENoticias() {
  const novidades = useQuery({
    queryKey: ['ajuda', 'novidades'],
    queryFn: () => api.get<{ itens: Novidade[] }>('/ajuda/novidades'),
    staleTime: MEIA_HORA,
  })
  const noticias = useQuery({
    queryKey: ['ajuda', 'noticias'],
    queryFn: () => api.get<{ itens: Noticia[]; fonte: string }>('/ajuda/noticias'),
    staleTime: MEIA_HORA,
  })
  const listaNovidades = novidades.data?.itens.slice(0, 3) ?? []
  const listaNoticias = noticias.data?.itens.slice(0, 6) ?? []

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-3 rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Rocket className="size-5 text-primary" />
          Novidades do Coffee Break
        </h2>
        {novidades.isLoading && <Carregando />}
        {!novidades.isLoading && listaNovidades.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Não deu para carregar as novidades agora. Veja todas no{' '}
            <a
              href="https://github.com/EvandroOdairCagniniJr/Coffee-Break/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              histórico de versões
            </a>
            .
          </p>
        )}
        <ol className="space-y-4">
          {listaNovidades.map((n) => (
            <li key={n.versao} className="space-y-1.5 border-l-2 border-primary/40 pl-3">
              <p className="text-xs text-muted-foreground">
                Versão {n.versao}, {tempoRelativo(n.publicada_em)}
              </p>
              <p className="font-semibold leading-snug">{n.titulo}</p>
              {n.destaques.length > 0 && (
                <ul className="space-y-1 text-sm text-foreground/80">
                  {n.destaques.slice(0, 3).map((d) => (
                    <li key={d} className="flex gap-2">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/40" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Newspaper className="size-5 text-primary" />
          Notícias do setor
        </h2>
        {noticias.isLoading && <Carregando />}
        {!noticias.isLoading && listaNoticias.length === 0 && (
          <p className="text-sm text-muted-foreground">Sem notícias para mostrar agora. Tente de novo mais tarde.</p>
        )}
        <ul className="divide-y">
          {listaNoticias.map((n) => (
            <li key={n.link}>
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 py-2.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug font-medium group-hover:text-primary group-hover:underline">
                    {n.titulo}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {n.fonte}
                    {n.publicada_em && `, ${tempoRelativo(n.publicada_em)}`}
                  </span>
                </span>
                <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-label="abre em outra aba" />
              </a>
            </li>
          ))}
        </ul>
        {listaNoticias.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Manchetes do {noticias.data?.fonte}. Cada notícia abre no site de quem publicou.
          </p>
        )}
      </section>
    </div>
  )
}

function Carregando() {
  return (
    <div className="space-y-2" aria-hidden>
      {[80, 95, 70].map((w) => (
        <div key={w} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}
