import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Check, Download, FileText, Loader2, RotateCcw, Search, ShieldCheck, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { enderecoEmLinha, mascaraCNPJ, mascaraCPF, mascaraTelefone } from '@/lib/documentos'
import { formatBRL, mensagemErro } from '@/lib/format'
import { cn } from '@/lib/utils'

type Status = 'pendente' | 'aprovada' | 'recusada' | 'suspensa'
type Acao = 'aprovar' | 'recusar' | 'suspender' | 'reativar'

interface Resumo {
  por_status: Record<Status, number>
  usuarios_ativos: number
  vendas_30_dias: number
  faturamento_30_dias: number
  novas_7_dias: number
}

interface PadariaLinha {
  id: string
  status: Status
  status_motivo: string | null
  created_at: string
  nome_fantasia: string | null
  razao_social: string | null
  cnpj: string | null
  cidade: string | null
  uf: string | null
  dono_nome: string | null
  dono_email: string | null
  pessoas: number
  documentos: number
  contrato_assinado: boolean
  ultimo_acesso: string | null
}

interface Detalhe {
  id: string
  dados: Record<string, unknown>
  status: Status
  status_motivo: string | null
  status_em: string | null
  codigo_convite: string
  created_at: string
  pessoas: Record<string, unknown>[]
  documentos: { id: string; descricao: string; nome_arquivo: string; tipo: string; tamanho: number; created_at: string }[]
  assinaturas: { nome_assinado: string; email_conta: string | null; versao: string; ip: string | null; assinado_em: string }[]
  aceites: { nome: string; email: string; versao: string; origem: string; ip: string | null; aceito_em: string }[]
  historico: { acao: string; status_anterior: string | null; status_novo: string; motivo: string | null; created_at: string; admin: string | null }[]
  numeros: { produtos: number; vendas: number; faturamento: number; ultima_venda: string | null }
}

const ROTULO_STATUS: Record<Status, string> = {
  pendente: 'Em análise',
  aprovada: 'Liberada',
  recusada: 'Recusada',
  suspensa: 'Suspensa',
}
const COR_STATUS: Record<Status, string> = {
  pendente: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  aprovada: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  recusada: 'bg-destructive/10 text-destructive',
  suspensa: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
}
const ACOES_POR_STATUS: Record<Status, Acao[]> = {
  pendente: ['aprovar', 'recusar'],
  recusada: ['aprovar'],
  aprovada: ['suspender'],
  suspensa: ['reativar'],
}
const ROTULO_ACAO: Record<Acao, string> = {
  aprovar: 'Liberar a padaria',
  recusar: 'Recusar o cadastro',
  suspender: 'Suspender o acesso',
  reativar: 'Reativar o acesso',
}

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—')
const dataHora = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—')

// Administração da plataforma: só aparece (e só funciona) para quem administra o Coffee Break.
export function PlataformaPage() {
  const [filtro, setFiltro] = useState<Status | 'todas'>('pendente')
  const [busca, setBusca] = useState('')
  const [aberta, setAberta] = useState<string | null>(null)

  const resumo = useQuery({ queryKey: ['plataforma', 'resumo'], queryFn: () => api.get<Resumo>('/plataforma/resumo') })
  const parametros = new URLSearchParams()
  if (filtro !== 'todas') parametros.set('status', filtro)
  if (busca.trim()) parametros.set('busca', busca.trim())
  const lista = useQuery({
    queryKey: ['plataforma', 'padarias', filtro, busca.trim()],
    queryFn: () => api.get<PadariaLinha[]>(`/plataforma/padarias?${parametros}`),
  })
  const r = resumo.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Administração do Coffee Break</h1>
          <p className="text-sm text-muted-foreground">Liberação das padarias e visão de toda a plataforma</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Numero rotulo="Esperando liberação" valor={r?.por_status.pendente} destaque={Boolean(r?.por_status.pendente)} />
        <Numero rotulo="Padarias liberadas" valor={r?.por_status.aprovada} />
        <Numero rotulo="Usuários ativos" valor={r?.usuarios_ativos} />
        <Numero
          rotulo="Vendas nos últimos 30 dias"
          valor={r ? `${r.vendas_30_dias} · ${formatBRL(r.faturamento_30_dias)}` : undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['pendente', 'recusada', 'aprovada', 'suspensa', 'todas'] as const).map((s) => (
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
            {s !== 'todas' && r && <span className="ml-1.5 opacity-75">{r.por_status[s]}</span>}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, CNPJ ou e-mail do dono"
            aria-label="Buscar padaria"
            className="pl-9"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {lista.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !lista.data?.length ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            {filtro === 'pendente' ? 'Nenhuma padaria esperando liberação.' : 'Nenhuma padaria encontrada.'}
          </p>
        ) : (
          <ul className="divide-y">
            {lista.data.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setAberta(p.id)}
                  className="grid w-full gap-1 px-5 py-3.5 text-left hover:bg-muted/50 md:grid-cols-[1.6fr_1.4fr_1fr_auto] md:items-center md:gap-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.nome_fantasia || 'Sem nome'}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[p.cnpj && mascaraCNPJ(p.cnpj), [p.cidade, p.uf].filter(Boolean).join('/')].filter(Boolean).join(' · ') || 'Sem CNPJ'}
                    </span>
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block truncate">{p.dono_nome}</span>
                    <span className="block truncate text-xs text-muted-foreground">{p.dono_email}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Cadastro em {data(p.created_at)}
                    <br />
                    {p.documentos} documento(s){p.contrato_assinado ? ', contrato assinado' : ', sem contrato'}
                  </span>
                  <span className={cn('w-fit rounded-full px-2.5 py-1 text-xs font-semibold', COR_STATUS[p.status])}>
                    {ROTULO_STATUS[p.status]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DetalhePadaria id={aberta} aoFechar={() => setAberta(null)} />
    </div>
  )
}

function Numero({ rotulo, valor, destaque }: { rotulo: string; valor: number | string | undefined; destaque?: boolean }) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 shadow-sm', destaque && 'border-amber-400 bg-amber-50 dark:bg-amber-950/30')}>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valor ?? '—'}</p>
    </div>
  )
}

const ROTULOS_DADOS: Record<string, string> = {
  nome_fantasia: 'Nome fantasia',
  razao_social: 'Razão social',
  cnpj: 'CNPJ',
  inscricao_estadual: 'Inscrição estadual',
  telefone: 'Telefone',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  instagram: 'Instagram',
  horario: 'Horário',
  endereco: 'Endereço',
}

function textoEndereco(e: unknown) {
  return e && typeof e === 'object' ? enderecoEmLinha(e as Parameters<typeof enderecoEmLinha>[0]) || null : null
}

async function baixarDocumento(padariaId: string, doc: { id: string; nome_arquivo: string }) {
  const r = await fetch(`/api/plataforma/padarias/${padariaId}/documentos/${doc.id}`, { credentials: 'include' })
  if (!r.ok) throw new Error('Não deu para baixar o documento')
  const url = URL.createObjectURL(await r.blob())
  const a = document.createElement('a')
  a.href = url
  a.download = doc.nome_arquivo
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

function DetalhePadaria({ id, aoFechar }: { id: string | null; aoFechar: () => void }) {
  const queryClient = useQueryClient()
  const detalhe = useQuery({
    queryKey: ['plataforma', 'padaria', id],
    queryFn: () => api.get<Detalhe>(`/plataforma/padarias/${id}`),
    enabled: Boolean(id),
  })
  const [acao, setAcao] = useState<Acao | null>(null)
  const [motivo, setMotivo] = useState('')
  const mudar = useMutation({
    mutationFn: (a: Acao) => api.post(`/plataforma/padarias/${id}/status`, { acao: a, motivo: motivo.trim() || undefined }),
    onSuccess: (_r, a) => {
      toast.success(a === 'aprovar' || a === 'reativar' ? 'Padaria liberada' : a === 'recusar' ? 'Cadastro recusado' : 'Acesso suspenso')
      setAcao(null)
      setMotivo('')
      void queryClient.invalidateQueries({ queryKey: ['plataforma'] })
    },
    onError: (e) => toast.error(mensagemErro(e, 'Não deu para mudar a situação')),
  })
  const d = detalhe.data
  const precisaMotivo = acao === 'recusar' || acao === 'suspender'

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(v) => {
        if (!v) {
          setAcao(null)
          setMotivo('')
          aoFechar()
        }
      }}
    >
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-3xl">
        {!d ? (
          <div className="flex justify-center py-12">
            <DialogTitle className="sr-only">Carregando padaria</DialogTitle>
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-heading text-2xl">{String(d.dados.nome_fantasia ?? 'Sem nome')}</DialogTitle>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', COR_STATUS[d.status])}>
                  {ROTULO_STATUS[d.status]}
                </span>
              </div>
              <DialogDescription>
                Cadastrada em {dataHora(d.created_at)} · código da equipe {d.codigo_convite}
              </DialogDescription>
            </DialogHeader>

            {d.status_motivo && (
              <p className="rounded-lg border bg-muted/40 p-3 text-sm">
                <strong>Motivo informado ao dono:</strong> {d.status_motivo}
              </p>
            )}

            <section className="space-y-3 rounded-xl border p-4">
              <h3 className="font-semibold">Decisão</h3>
              {!acao ? (
                <div className="flex flex-wrap gap-2">
                  {ACOES_POR_STATUS[d.status].map((a) => (
                    <Button
                      key={a}
                      variant={a === 'aprovar' || a === 'reativar' ? 'default' : 'outline'}
                      onClick={() => (a === 'recusar' || a === 'suspender' ? setAcao(a) : mudar.mutate(a))}
                      disabled={mudar.isPending}
                    >
                      {a === 'aprovar' || a === 'reativar' ? <Check className="size-4" /> : a === 'recusar' ? <X className="size-4" /> : <Ban className="size-4" />}
                      {ROTULO_ACAO[a]}
                    </Button>
                  ))}
                </div>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    mudar.mutate(acao)
                  }}
                >
                  <label htmlFor="motivo-plataforma" className="block text-sm font-medium">
                    {precisaMotivo ? 'Motivo (o dono vê esta mensagem)' : 'Observação'}
                  </label>
                  <textarea
                    id="motivo-plataforma"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder={
                      acao === 'recusar'
                        ? 'Ex.: O CNPJ informado não confere com o cartão CNPJ enviado. Envie o cartão atualizado.'
                        : 'Ex.: Uso em desacordo com a Cláusula 4 do contrato.'
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" variant="destructive" disabled={mudar.isPending || motivo.trim().length < 10}>
                      {ROTULO_ACAO[acao]}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setAcao(null)}>
                      <RotateCcw className="size-4" />
                      Voltar
                    </Button>
                  </div>
                </form>
              )}
            </section>

            <Bloco titulo="Dados da padaria">
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {Object.entries(ROTULOS_DADOS).map(([chave, rotulo]) => {
                  const bruto = chave === 'endereco' ? textoEndereco(d.dados.endereco) : d.dados[chave]
                  const valor =
                    chave === 'cnpj' ? mascaraCNPJ(String(bruto ?? '')) : chave === 'telefone' || chave === 'whatsapp' ? mascaraTelefone(String(bruto ?? '')) : bruto
                  return (
                    <div key={chave} className={chave === 'endereco' ? 'sm:col-span-2' : undefined}>
                      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
                      <dd className="break-words">{valor ? String(valor) : '—'}</dd>
                    </div>
                  )
                })}
              </dl>
            </Bloco>

            <Bloco titulo={`Documentos (${d.documentos.length})`}>
              {d.documentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum documento enviado.</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {d.documentos.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <FileText className="size-5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{doc.descricao}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {doc.nome_arquivo} · {Math.ceil(doc.tamanho / 1024)} KB · {dataHora(doc.created_at)}
                        </span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => baixarDocumento(d.id, doc).catch((e) => toast.error(mensagemErro(e, 'Erro')))}
                      >
                        <Download className="size-4" />
                        Baixar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Bloco>

            <Bloco titulo={`Pessoas (${d.pessoas.length})`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="py-1.5 pr-3 font-medium">Nome</th>
                      <th className="py-1.5 pr-3 font-medium">E-mail</th>
                      <th className="py-1.5 pr-3 font-medium">Papel</th>
                      <th className="py-1.5 pr-3 font-medium">CPF</th>
                      <th className="py-1.5 pr-3 font-medium">Telefone</th>
                      <th className="py-1.5 font-medium">Último acesso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {d.pessoas.map((p) => (
                      <tr key={String(p.id)} className={p.ativo ? undefined : 'opacity-60'}>
                        <td className="py-1.5 pr-3">{String(p.nome)}</td>
                        <td className="py-1.5 pr-3">{String(p.email)}</td>
                        <td className="py-1.5 pr-3">{String(p.papel)}</td>
                        <td className="py-1.5 pr-3">{p.cpf ? mascaraCPF(String(p.cpf)) : '—'}</td>
                        <td className="py-1.5 pr-3">{p.telefone ? mascaraTelefone(String(p.telefone)) : '—'}</td>
                        <td className="py-1.5">{dataHora(p.ultimo_acesso as string | null)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Bloco>

            <Bloco titulo="Contrato e termos">
              {d.assinaturas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Contrato ainda não assinado.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {d.assinaturas.map((a) => (
                    <li key={a.assinado_em}>
                      Contrato {a.versao} assinado por <strong>{a.nome_assinado}</strong> ({a.email_conta}) em{' '}
                      {dataHora(a.assinado_em)}, IP {a.ip ?? '—'}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                {d.aceites.length} aceite(s) dos Termos registrados. Dossiê completo: npm run provas -- e-mail.
              </p>
            </Bloco>

            <Bloco titulo="Uso do sistema">
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-muted-foreground">Produtos</dt><dd className="font-semibold">{d.numeros.produtos}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Vendas</dt><dd className="font-semibold">{d.numeros.vendas}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Faturamento</dt><dd className="font-semibold">{formatBRL(d.numeros.faturamento)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Última venda</dt><dd className="font-semibold">{data(d.numeros.ultima_venda)}</dd></div>
              </dl>
            </Bloco>

            <Bloco titulo="Histórico da administração">
              {d.historico.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma decisão ainda.</p>
              ) : (
                <ol className="space-y-2 text-sm">
                  {d.historico.map((h) => (
                    <li key={h.created_at} className="border-l-2 border-primary/40 pl-3">
                      <span className="font-medium">{ROTULO_ACAO[h.acao as Acao] ?? h.acao}</span> por {h.admin ?? '—'} em{' '}
                      {dataHora(h.created_at)}
                      {h.motivo && <span className="block text-muted-foreground">{h.motivo}</span>}
                    </li>
                  ))}
                </ol>
              )}
            </Bloco>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold">{titulo}</h3>
      {children}
    </section>
  )
}
