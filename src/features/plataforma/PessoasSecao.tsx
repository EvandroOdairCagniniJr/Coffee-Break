import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, LogOut, Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { mensagemErro } from '@/lib/format'
import { cn } from '@/lib/utils'
import { dataHora, ROTULO_PAPEL, SeloStatus, Vazio, type Status } from '@/features/plataforma/comum'

interface PessoaPlataforma {
  id: string
  nome: string
  email: string
  papel: string
  cargo: string | null
  ativo: boolean
  created_at: string
  ultimo_acesso: string | null
  plataforma_admin: boolean
  padaria_id: string | null
  padaria: string | null
  padaria_status: Status | null
  bloqueio_por_senha: boolean
}

// Todas as pessoas de todas as padarias: buscar, bloquear o acesso e encerrar sessões.
export function PessoasSecao({ abrirPadaria }: { abrirPadaria: (id: string) => void }) {
  const queryClient = useQueryClient()
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState<'todas' | 'ativas' | 'bloqueadas'>('todas')
  const parametros = new URLSearchParams({ situacao })
  if (busca.trim()) parametros.set('busca', busca.trim())
  const lista = useQuery({
    queryKey: ['plataforma', 'pessoas', situacao, busca.trim()],
    queryFn: () => api.get<PessoaPlataforma[]>(`/plataforma/pessoas?${parametros}`),
  })
  const atualizar = () => void queryClient.invalidateQueries({ queryKey: ['plataforma'] })
  const acesso = useMutation({
    mutationFn: (p: PessoaPlataforma) => api.post(`/plataforma/pessoas/${p.id}/acesso`, { ativo: !p.ativo }),
    onSuccess: (_r, p) => {
      toast.success(p.ativo ? `${p.nome} não entra mais no sistema` : `${p.nome} pode entrar de novo`)
      atualizar()
    },
    onError: (e) => toast.error(mensagemErro(e, 'Não deu para mudar o acesso')),
  })
  const sessoes = useMutation({
    mutationFn: (p: PessoaPlataforma) => api.post(`/plataforma/pessoas/${p.id}/encerrar-sessoes`),
    onSuccess: (_r, p) => toast.success(`${p.nome} vai precisar entrar de novo`),
    onError: (e) => toast.error(mensagemErro(e, 'Não deu para encerrar as sessões')),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filtrar pessoas" className="flex gap-1.5">
          {(
            [
              ['todas', 'Todas'],
              ['ativas', 'Com acesso'],
              ['bloqueadas', 'Sem acesso'],
            ] as const
          ).map(([v, r]) => (
            <button
              key={v}
              type="button"
              aria-pressed={situacao === v}
              onClick={() => setSituacao(v)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                situacao === v ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, e-mail ou padaria"
            aria-label="Buscar pessoa"
            className="pl-9"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {lista.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !lista.data?.length ? (
          <Vazio>Ninguém encontrado.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Pessoa</th>
                  <th className="px-3 py-2.5 font-medium">Padaria</th>
                  <th className="px-3 py-2.5 font-medium">Papel</th>
                  <th className="px-3 py-2.5 font-medium">Último acesso</th>
                  <th className="px-5 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {lista.data.map((p) => (
                  <tr key={p.id} className={p.ativo ? undefined : 'bg-muted/30 text-muted-foreground'}>
                    <td className="px-5 py-2.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        {p.nome}
                        {p.plataforma_admin && <ShieldCheck className="size-4 text-primary" aria-label="Administração" />}
                      </span>
                      <span className="block text-xs text-muted-foreground">{p.email}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {p.padaria_id ? (
                        <button
                          type="button"
                          onClick={() => abrirPadaria(p.padaria_id as string)}
                          className="block text-left hover:text-primary hover:underline"
                        >
                          {p.padaria ?? 'Sem nome'}
                        </button>
                      ) : (
                        '—'
                      )}
                      {p.padaria_status && p.padaria_status !== 'aprovada' && <SeloStatus status={p.padaria_status} className="mt-0.5" />}
                    </td>
                    <td className="px-3 py-2.5">
                      {ROTULO_PAPEL[p.papel] ?? p.papel}
                      {!p.ativo && <span className="block text-xs text-destructive">sem acesso</span>}
                      {p.bloqueio_por_senha && <span className="block text-xs text-amber-700">travada por senha errada</span>}
                    </td>
                    <td className="px-3 py-2.5">{dataHora(p.ultimo_acesso)}</td>
                    <td className="px-5 py-2.5">
                      {!p.plataforma_admin && (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Encerrar as sessões de ${p.nome}`}
                            title="Encerrar sessões"
                            onClick={() => sessoes.mutate(p)}
                            disabled={sessoes.isPending}
                          >
                            <LogOut className="size-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => acesso.mutate(p)} disabled={acesso.isPending}>
                            {p.ativo ? 'Bloquear' : 'Liberar'}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
