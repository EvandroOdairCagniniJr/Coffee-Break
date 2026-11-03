import { useQuery } from '@tanstack/react-query'
import { Download, FileText, Loader2, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { mascaraCNPJ } from '@/lib/documentos'
import { mensagemErro } from '@/lib/format'
import { cn } from '@/lib/utils'
import { baixar, data, dataHora, ROTULO_STATUS, SeloStatus, Vazio, type PadariaLinha, type Resumo, type Status } from '@/features/plataforma/comum'

const FILTROS = ['pendente', 'recusada', 'aprovada', 'suspensa', 'todas'] as const

// Todas as padarias da plataforma: fila de liberação, busca e planilha.
export function PadariasSecao({ abrirPadaria }: { abrirPadaria: (id: string) => void }) {
  const [filtro, setFiltro] = useState<Status | 'todas'>('pendente')
  const [busca, setBusca] = useState('')
  const resumo = useQuery({ queryKey: ['plataforma', 'resumo'], queryFn: () => api.get<Resumo>('/plataforma/resumo') })
  const parametros = new URLSearchParams()
  if (filtro !== 'todas') parametros.set('status', filtro)
  if (busca.trim()) parametros.set('busca', busca.trim())
  const lista = useQuery({
    queryKey: ['plataforma', 'padarias', filtro, busca.trim()],
    queryFn: () => api.get<PadariaLinha[]>(`/plataforma/padarias?${parametros}`),
  })
  const contagem = resumo.data?.por_status

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap gap-1.5">
          {FILTROS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFiltro(s)}
              aria-pressed={filtro === s}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                filtro === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
              )}
            >
              {s === 'todas' ? 'Todas' : ROTULO_STATUS[s]}
              {s !== 'todas' && contagem && <span className="ml-1.5 tabular-nums opacity-75">{contagem[s]}</span>}
            </button>
          ))}
        </div>
        <div className="ml-auto flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, CNPJ ou e-mail do dono"
              aria-label="Buscar padaria"
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const p = new URLSearchParams(parametros)
              p.set('formato', 'csv')
              baixar(`/api/plataforma/padarias?${p}`, 'padarias-coffee-break.csv').catch((e) =>
                toast.error(mensagemErro(e, 'Não deu para gerar a planilha')),
              )
            }}
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">Planilha</span>
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {lista.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !lista.data?.length ? (
          <Vazio>{filtro === 'pendente' ? 'Nenhuma padaria esperando liberação. Tudo em dia.' : 'Nenhuma padaria encontrada.'}</Vazio>
        ) : (
          <ul className="divide-y">
            {lista.data.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => abrirPadaria(p.id)}
                  className="grid w-full gap-1 px-5 py-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none md:grid-cols-[1.6fr_1.4fr_1.1fr_auto] md:items-center md:gap-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.nome_fantasia || 'Sem nome'}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[p.cnpj && mascaraCNPJ(p.cnpj), [p.cidade, p.uf].filter(Boolean).join('/')].filter(Boolean).join(' · ') ||
                        'Sem CNPJ'}
                    </span>
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block truncate">{p.dono_nome}</span>
                    <span className="block truncate text-xs text-muted-foreground">{p.dono_email}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {p.status === 'aprovada' ? (
                      <>
                        {p.vendas_30_dias} vendas em 30 dias
                        <br />
                        último acesso {dataHora(p.ultimo_acesso)}
                      </>
                    ) : (
                      <>
                        Cadastro em {data(p.created_at)}
                        <br />
                        <span className="inline-flex items-center gap-1">
                          <FileText className="size-3" />
                          {p.documentos} documento(s){p.contrato_assinado ? ', contrato assinado' : ', sem contrato'}
                        </span>
                      </>
                    )}
                  </span>
                  <SeloStatus status={p.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
