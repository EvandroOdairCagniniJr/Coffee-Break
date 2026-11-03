import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, FileText, Loader2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useContagem } from '@/hooks/useContagem'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Cartao, data, type Resumo } from '@/features/plataforma/comum'

// Visão geral da plataforma: o que espera por você, os números e os últimos 30 dias.
export function VisaoGeral({ abrirPadaria }: { abrirPadaria: (id: string) => void }) {
  const resumo = useQuery({
    queryKey: ['plataforma', 'resumo'],
    queryFn: () => api.get<Resumo>('/plataforma/resumo'),
    refetchInterval: 60_000,
  })
  const r = resumo.data
  if (!r) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  const pendentes = r.por_status.pendente

  return (
    <div className="space-y-5">
      {/* O que precisa de você agora */}
      <section className="relative overflow-hidden rounded-3xl bg-[#2a170c] p-6 text-[#fff6e8] shadow-lg sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[auto_1fr] lg:items-end">
          <div>
            <p className="text-sm text-[#fff6e8]/70">Esperando a sua liberação</p>
            <p className="font-heading text-7xl leading-none font-semibold tabular-nums sm:text-8xl">
              <Contador valor={pendentes} />
            </p>
            <p className="mt-2 text-sm text-[#fff6e8]/70">
              {r.novas_7_dias} cadastro(s) novo(s) nesta semana
            </p>
          </div>
          <div className="space-y-2">
            {r.fila.length === 0 ? (
              <p className="rounded-xl bg-white/5 px-4 py-3 text-sm text-[#fff6e8]/80">
                Nenhuma padaria na fila. Tudo em dia.
              </p>
            ) : (
              r.fila.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => abrirPadaria(p.id)}
                  className="flex w-full items-center gap-3 rounded-xl bg-white/[0.06] px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.12] focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{p.nome_fantasia || 'Sem nome'}</span>
                  <span className="flex items-center gap-1 text-xs text-[#fff6e8]/65">
                    <FileText className="size-3.5" />
                    {p.documentos}
                  </span>
                  <span className="text-xs text-[#fff6e8]/65">desde {data(p.created_at)}</span>
                  <ArrowRight className="size-4 text-amber-300" />
                </button>
              ))
            )}
            {pendentes > r.fila.length && (
              <Link to="/plataforma/padarias" className="inline-block text-sm text-amber-300 hover:underline">
                Ver a fila inteira ({pendentes})
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="entra-escalonado grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Padarias liberadas" valor={<Contador valor={r.por_status.aprovada} />} detalhe={`${r.padarias_vendendo_hoje} vendendo nas últimas 24 h`} />
        <Indicador rotulo="Pessoas usando" valor={<Contador valor={r.usuarios_ativos} />} detalhe={`${r.pessoas_hoje} entraram nas últimas 24 h`} />
        <Indicador rotulo="Vendas em 30 dias" valor={<Contador valor={r.vendas_30_dias} />} detalhe={formatBRL(r.faturamento_30_dias)} />
        <Indicador
          rotulo="Alertas de acesso (24 h)"
          valor={<Contador valor={r.alertas_24h} />}
          detalhe="Senhas erradas e bloqueios"
          alerta={r.alertas_24h >= 10}
          link="/plataforma/atividade"
        />
      </div>

      <div className="entra-escalonado grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Cartao>
          <Grafico
            titulo="Faturamento das padarias"
            serie={r.serie.map((d) => ({ dia: d.dia, valor: d.faturamento, extra: `${d.vendas} vendas` }))}
            formatar={formatBRL}
          />
        </Cartao>
        <Cartao>
          <Grafico
            titulo="Cadastros de padarias"
            serie={r.serie.map((d) => ({ dia: d.dia, valor: d.cadastros }))}
            formatar={(n) => String(n)}
            cor="#b45309"
          />
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <Mini rotulo="Recusadas" valor={r.por_status.recusada} />
            <Mini rotulo="Suspensas" valor={r.por_status.suspensa} />
            <Mini rotulo="Novas em 30 dias" valor={r.novas_30_dias} />
          </dl>
        </Cartao>
      </div>
    </div>
  )
}

function Indicador({
  rotulo,
  valor,
  detalhe,
  alerta,
  link,
}: {
  rotulo: string
  valor: ReactNode
  detalhe?: string
  alerta?: boolean
  link?: string
}) {
  const corpo = (
    <>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {alerta && <AlertTriangle className="size-3.5 text-destructive" />}
        {rotulo}
      </p>
      <p className={cn('mt-1 text-3xl font-bold tabular-nums', alerta && 'text-destructive')}>{valor}</p>
      {detalhe && <p className="mt-0.5 truncate text-xs text-muted-foreground">{detalhe}</p>}
    </>
  )
  const classe = 'cartao-vivo rounded-2xl border bg-card p-4 shadow-sm'
  return link ? (
    <Link to={link} className={cn(classe, 'block transition-colors hover:border-primary/50')}>
      {corpo}
    </Link>
  ) : (
    <div className={classe}>{corpo}</div>
  )
}

function Mini({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-lg bg-muted/50 py-2">
      <dd className="text-lg font-bold tabular-nums">{valor}</dd>
      <dt className="text-muted-foreground">{rotulo}</dt>
    </div>
  )
}

// Barras dos últimos 30 dias, com o valor do dia ao passar o mouse ou tocar.
function Grafico({
  titulo,
  serie,
  formatar,
  cor = '#7c4a1e',
}: {
  titulo: string
  serie: { dia: string; valor: number; extra?: string }[]
  formatar: (n: number) => string
  cor?: string
}) {
  const [foco, setFoco] = useState<number | null>(null)
  const maximo = Math.max(1, ...serie.map((s) => s.valor))
  const total = serie.reduce((a, s) => a + s.valor, 0)
  const atual = foco !== null ? serie[foco] : null
  const W = 300
  const H = 90
  const largura = W / serie.length
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold">{titulo}</h2>
        <p className="text-right text-sm tabular-nums">
          {atual ? (
            <>
              <span className="font-semibold">{formatar(atual.valor)}</span>{' '}
              <span className="text-muted-foreground">
                em {new Date(`${atual.dia}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                {atual.extra ? `, ${atual.extra}` : ''}
              </span>
            </>
          ) : (
            <>
              <span className="font-semibold">{formatar(total)}</span> <span className="text-muted-foreground">em 30 dias</span>
            </>
          )}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-28 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${titulo}: ${formatar(total)} nos últimos 30 dias`}
        onMouseLeave={() => setFoco(null)}
      >
        {serie.map((s, i) => {
          const h = s.valor > 0 ? Math.max(2, (s.valor / maximo) * (H - 4)) : 1
          return (
            <rect
              key={s.dia}
              x={i * largura + largura * 0.15}
              y={H - h}
              width={largura * 0.7}
              height={h}
              rx={1.5}
              fill={cor}
              opacity={foco === null || foco === i ? (s.valor > 0 ? 0.9 : 0.2) : 0.35}
              onMouseEnter={() => setFoco(i)}
              onClick={() => setFoco(i)}
            />
          )
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{new Date(`${serie[0]?.dia}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
        <span>hoje</span>
      </div>
    </div>
  )
}

function Contador({ valor }: { valor: number }) {
  const n = useContagem(valor)
  return <>{Math.round(n).toLocaleString('pt-BR')}</>
}
