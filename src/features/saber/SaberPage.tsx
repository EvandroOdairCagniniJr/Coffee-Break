import { ChefHat, ChevronDown, Lightbulb, Scale, Search, ShieldAlert, Store, TrendingUp, Users, UserRound, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthContext'
import {
  ATUALIZADO_EM,
  dicas,
  secoes,
  tiposDica,
  type Publico,
  type TipoDica,
  type Topico,
} from '@/features/saber/conteudo'
import { cn } from '@/lib/utils'

type Aba = Publico | 'dicas'

const abas: { id: Aba; label: string; icone: LucideIcon }[] = [
  { id: 'dono', label: 'Para o dono', icone: Store },
  { id: 'equipe', label: 'Para a equipe', icone: Users },
  { id: 'clientes', label: 'Para os clientes', icone: UserRound },
  { id: 'dicas', label: 'Você sabia?', icone: Lightbulb },
]

const iconesTipo: Record<TipoDica, LucideIcon> = {
  lei: Scale,
  tecnica: ChefHat,
  gestao: TrendingUp,
  seguranca: ShieldAlert,
}

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function SaberPage() {
  const { user } = useAuth()
  const [aba, setAba] = useState<Aba>(user?.papel === 'funcionario' ? 'equipe' : 'dono')
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState<TipoDica | null>(null)
  const termo = normalizar(busca.trim())

  // Com busca, procura em tudo (todas as abas) de uma vez.
  const resultados = useMemo(() => {
    if (!termo) return null
    const topicos = secoes.flatMap((s) =>
      s.topicos
        .filter((t) => normalizar([t.titulo, ...t.itens, t.base ?? ''].join(' ')).includes(termo))
        .map((t) => ({ ...t, publico: s.titulo })),
    )
    const achadas = dicas.filter((d) => normalizar(`${d.titulo} ${d.texto} ${d.base ?? ''}`).includes(termo))
    return { topicos, dicas: achadas }
  }, [termo])

  const secao = secoes.find((s) => s.publico === aba)
  const dicasFiltradas = tipo ? dicas.filter((d) => d.tipo === tipo) : dicas

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leis e boas práticas</h1>
        <p className="text-sm text-muted-foreground">
          Direitos, deveres e dicas para o dono, a equipe e os clientes da padaria
        </p>
      </div>

      <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
        Resumo de orientação, atualizado em {ATUALIZADO_EM}. Não substitui o contador, o advogado,
        o sindicato ou a Vigilância Sanitária da sua cidade. A convenção coletiva e as leis
        municipais e estaduais podem trazer regras a mais.
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar: férias, validade, troco, noturno…"
          className="pl-9"
          aria-label="Buscar nas leis e dicas"
        />
      </div>

      {resultados ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {resultados.topicos.length + resultados.dicas.length} resultado(s) para "{busca.trim()}"
          </p>
          {resultados.topicos.map((t) => (
            <TopicoCard key={t.id} topico={t} rotulo={t.publico} aberto />
          ))}
          <div className="grid gap-3 md:grid-cols-2">
            {resultados.dicas.map((d) => (
              <DicaCard key={d.id} dica={d} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div role="tablist" className="flex flex-wrap gap-1 rounded-xl border bg-card p-1">
            {abas.map((a) => (
              <button
                key={a.id}
                role="tab"
                aria-selected={aba === a.id}
                onClick={() => setAba(a.id)}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  aba === a.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <a.icone className="size-4" />
                {a.label}
              </button>
            ))}
          </div>

          {secao && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{secao.resumo}</p>
              {secao.topicos.map((t, i) => (
                <TopicoCard key={t.id} topico={t} aberto={i === 0} />
              ))}
            </div>
          )}

          {aba === 'dicas' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {([null, 'lei', 'tecnica', 'gestao', 'seguranca'] as const).map((t) => (
                  <button
                    key={t ?? 'todas'}
                    onClick={() => setTipo(t)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm',
                      tipo === t ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
                    )}
                  >
                    {t ? tiposDica[t] : 'Todas'}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {dicasFiltradas.map((d) => (
                  <DicaCard key={d.id} dica={d} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TopicoCard({ topico, rotulo, aberto = false }: { topico: Topico; rotulo?: string; aberto?: boolean }) {
  const [expandido, setExpandido] = useState(aberto)
  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        aria-expanded={expandido}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span>
          {rotulo && <span className="block text-xs text-muted-foreground">{rotulo}</span>}
          <span className="font-heading text-lg font-semibold">{topico.titulo}</span>
        </span>
        <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform', expandido && 'rotate-180')} />
      </button>
      {expandido && (
        <div className="space-y-3 border-t px-4 pt-3 pb-4">
          <ul className="space-y-2">
            {topico.itens.map((item) => (
              <li key={item} className="flex gap-2 text-[15px] leading-relaxed">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {topico.base && <p className="text-xs text-muted-foreground">Base legal: {topico.base}</p>}
        </div>
      )}
    </section>
  )
}

function DicaCard({ dica }: { dica: (typeof dicas)[number] }) {
  const Icone = iconesTipo[dica.tipo]
  return (
    <article className="flex gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300">
        <Icone className="size-4.5" />
      </span>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-300">
          {tiposDica[dica.tipo]}
        </p>
        <p className="font-semibold leading-snug">{dica.titulo}</p>
        <p className="text-sm text-foreground/80">{dica.texto}</p>
        {dica.base && <p className="text-xs text-muted-foreground">Base: {dica.base}</p>}
      </div>
    </article>
  )
}
