import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Gavel, Loader2, LogIn } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { dataHora, ROTULO_ACAO, ROTULO_EVENTO, Vazio } from '@/features/plataforma/comum'

type Tipo = 'acessos' | 'alertas' | 'decisoes'

interface Acesso {
  id: string
  evento: string
  email: string | null
  ip: string | null
  created_at: string
  padaria_id: string | null
  padaria: string | null
  nome: string | null
}

interface Decisao {
  id: string
  acao: string
  motivo: string | null
  created_at: string
  padaria: string | null
  padaria_id: string | null
  alvo: string | null
}

const SUSPEITOS = new Set(['login_falhou', 'conta_bloqueada'])

// O que acontece na plataforma: entradas, tentativas suspeitas e as suas decisões.
export function AtividadeSecao({ abrirPadaria }: { abrirPadaria: (id: string) => void }) {
  const [tipo, setTipo] = useState<Tipo>('acessos')
  const lista = useQuery({
    queryKey: ['plataforma', 'atividade', tipo],
    queryFn: () => api.get<(Acesso | Decisao)[]>(`/plataforma/atividade?tipo=${tipo}`),
    refetchInterval: 30_000,
  })

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Tipo de atividade" className="inline-flex rounded-xl border bg-card p-1">
        {(
          [
            ['acessos', 'Acessos', LogIn],
            ['alertas', 'Alertas', AlertTriangle],
            ['decisoes', 'Suas decisões', Gavel],
          ] as const
        ).map(([v, r, Icone]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={tipo === v}
            onClick={() => setTipo(v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              tipo === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icone className="size-4" />
            {r}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {lista.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !lista.data?.length ? (
          <Vazio>{tipo === 'alertas' ? 'Nenhuma tentativa suspeita. Tudo tranquilo.' : 'Nada por aqui ainda.'}</Vazio>
        ) : tipo === 'decisoes' ? (
          <ol className="divide-y">
            {(lista.data as Decisao[]).map((d) => (
              <li key={d.id} className="px-5 py-3 text-sm">
                <p>
                  <span className="font-medium">{ROTULO_ACAO[d.acao] ?? d.acao}</span>
                  {d.alvo && <span> ({d.alvo})</span>}
                  {d.padaria && (
                    <>
                      {' '}
                      em{' '}
                      <button type="button" onClick={() => abrirPadaria(d.padaria_id as string)} className="font-medium text-primary hover:underline">
                        {d.padaria}
                      </button>
                    </>
                  )}
                </p>
                {d.motivo && <p className="text-muted-foreground">{d.motivo}</p>}
                <p className="text-xs text-muted-foreground">{dataHora(d.created_at)}</p>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="divide-y">
            {(lista.data as Acesso[]).map((a) => {
              const suspeito = SUSPEITOS.has(a.evento)
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-0.5 px-5 py-2.5 text-sm">
                  <span className={cn('w-44 shrink-0 font-medium', suspeito && 'text-destructive')}>
                    {suspeito && <AlertTriangle className="mr-1 inline size-3.5" />}
                    {ROTULO_EVENTO[a.evento] ?? a.evento}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {a.nome ?? a.email ?? '—'}
                    {a.padaria && (
                      <>
                        {' · '}
                        <button type="button" onClick={() => abrirPadaria(a.padaria_id as string)} className="text-primary hover:underline">
                          {a.padaria}
                        </button>
                      </>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    IP {a.ip ?? '—'} · {dataHora(a.created_at)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
