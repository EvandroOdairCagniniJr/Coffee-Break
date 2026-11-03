import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Check, Download, FileText, Loader2, LogOut, RotateCcw, Send, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { enderecoEmLinha, mascaraCNPJ, mascaraCPF, mascaraTelefone } from '@/lib/documentos'
import { formatBRL, mensagemErro } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  baixar,
  data,
  dataHora,
  ROTULO_ACAO,
  ROTULO_EVENTO,
  ROTULO_PAPEL,
  SeloStatus,
  type Acao,
  type Status,
} from '@/features/plataforma/comum'

interface Pessoa {
  id: string
  nome: string
  email: string
  papel: string
  cargo: string | null
  ativo: boolean
  telefone: string | null
  cpf: string | null
  created_at: string
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
  pessoas: Pessoa[]
  documentos: { id: string; descricao: string; nome_arquivo: string; tipo: string; tamanho: number; created_at: string }[]
  assinaturas: { nome_assinado: string; email_conta: string | null; versao: string; ip: string | null; assinado_em: string }[]
  aceites: { nome: string; email: string; versao: string; origem: string; ip: string | null; aceito_em: string }[]
  historico: { acao: string; motivo: string | null; created_at: string; admin: string | null; alvo: string | null }[]
  notas: { id: string; texto: string; created_at: string; autor: string | null }[]
  acessos: { evento: string; email: string | null; ip: string | null; created_at: string }[]
  numeros: {
    produtos: number
    vendas: number
    faturamento: number
    faturamento_30_dias: number
    ultima_venda: string | null
    encomendas: number
  }
}

const ACOES_POR_STATUS: Record<Status, Acao[]> = {
  pendente: ['aprovar', 'recusar'],
  recusada: ['aprovar'],
  aprovada: ['suspender'],
  suspensa: ['reativar'],
}
const BOTAO_ACAO: Record<Acao, string> = {
  aprovar: 'Liberar a padaria',
  recusar: 'Recusar o cadastro',
  suspender: 'Suspender o acesso',
  reativar: 'Reativar o acesso',
}

type Aba = 'resumo' | 'cadastro' | 'pessoas' | 'documentos' | 'legal' | 'historico'

const ROTULOS_DADOS: [string, string][] = [
  ['nome_fantasia', 'Nome fantasia'],
  ['razao_social', 'Razão social'],
  ['cnpj', 'CNPJ'],
  ['inscricao_estadual', 'Inscrição estadual'],
  ['telefone', 'Telefone'],
  ['whatsapp', 'WhatsApp'],
  ['email', 'E-mail'],
  ['instagram', 'Instagram'],
  ['horario', 'Horário'],
  ['endereco', 'Endereço'],
]

function valorDoCadastro(chave: string, dados: Record<string, unknown>) {
  const v = dados[chave]
  if (!v) return '—'
  if (chave === 'cnpj') return mascaraCNPJ(String(v))
  if (chave === 'telefone' || chave === 'whatsapp') return mascaraTelefone(String(v))
  if (chave === 'endereco') return enderecoEmLinha(v as Parameters<typeof enderecoEmLinha>[0]) || '—'
  return String(v)
}

// Ficha completa de uma padaria, com as decisões da administração.
export function DetalhePadaria({ id, aoFechar }: { id: string | null; aoFechar: () => void }) {
  const queryClient = useQueryClient()
  const [aba, setAba] = useState<Aba>('resumo')
  const detalhe = useQuery({
    queryKey: ['plataforma', 'padaria', id],
    queryFn: () => api.get<Detalhe>(`/plataforma/padarias/${id}`),
    enabled: Boolean(id),
  })
  const atualizar = () => void queryClient.invalidateQueries({ queryKey: ['plataforma'] })
  const d = detalhe.data

  const abas: [Aba, string][] = d
    ? [
        ['resumo', 'Resumo'],
        ['cadastro', 'Cadastro'],
        ['pessoas', `Pessoas (${d.pessoas.length})`],
        ['documentos', `Documentos (${d.documentos.length})`],
        ['legal', 'Contrato'],
        ['historico', 'Histórico'],
      ]
    : []

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(v) => {
        if (!v) {
          setAba('resumo')
          aoFechar()
        }
      }}
    >
      <DialogContent className="flex max-h-[94svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        {!d ? (
          <div className="flex justify-center py-16">
            <DialogTitle className="sr-only">Carregando padaria</DialogTitle>
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-1 border-b px-6 pt-6 pb-4 text-left">
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <DialogTitle className="font-heading text-2xl">{String(d.dados.nome_fantasia ?? 'Sem nome')}</DialogTitle>
                <SeloStatus status={d.status} />
              </div>
              <DialogDescription>
                {d.dados.cnpj ? `CNPJ ${mascaraCNPJ(String(d.dados.cnpj))} · ` : ''}cadastrada em {dataHora(d.created_at)} · código
                da equipe {d.codigo_convite}
              </DialogDescription>
              <div role="tablist" aria-label="Partes da ficha" className="-mb-4 flex gap-1 overflow-x-auto pt-3">
                {abas.map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    role="tab"
                    aria-selected={aba === valor}
                    onClick={() => setAba(valor)}
                    className={cn(
                      'border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                      aba === valor ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </DialogHeader>

            <div role="tabpanel" className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {aba === 'resumo' && <AbaResumo d={d} aoMudar={atualizar} />}
              {aba === 'cadastro' && (
                <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                  {ROTULOS_DADOS.map(([chave, rotulo]) => (
                    <div key={chave} className={chave === 'endereco' ? 'sm:col-span-2' : undefined}>
                      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
                      <dd className="break-words">{valorDoCadastro(chave, d.dados)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {aba === 'pessoas' && <AbaPessoas d={d} aoMudar={atualizar} />}
              {aba === 'documentos' && <AbaDocumentos d={d} />}
              {aba === 'legal' && <AbaLegal d={d} />}
              {aba === 'historico' && <AbaHistorico d={d} />}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Bloco({ titulo, children, acao }: { titulo: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{titulo}</h3>
        {acao}
      </div>
      {children}
    </section>
  )
}

function AbaResumo({ d, aoMudar }: { d: Detalhe; aoMudar: () => void }) {
  const queryClient = useQueryClient()
  const [acao, setAcao] = useState<Acao | null>(null)
  const [motivo, setMotivo] = useState('')
  const [nota, setNota] = useState('')
  const mudar = useMutation({
    mutationFn: (a: Acao) => api.post(`/plataforma/padarias/${d.id}/status`, { acao: a, motivo: motivo.trim() || undefined }),
    onSuccess: (_r, a) => {
      toast.success(a === 'aprovar' || a === 'reativar' ? 'Padaria liberada' : a === 'recusar' ? 'Cadastro recusado' : 'Acesso suspenso')
      setAcao(null)
      setMotivo('')
      aoMudar()
    },
    onError: (e) => toast.error(mensagemErro(e, 'Não deu para mudar a situação')),
  })
  const anotar = useMutation({
    mutationFn: () => api.post(`/plataforma/padarias/${d.id}/notas`, { texto: nota.trim() }),
    onSuccess: () => {
      setNota('')
      void queryClient.invalidateQueries({ queryKey: ['plataforma', 'padaria', d.id] })
    },
    onError: (e) => toast.error(mensagemErro(e, 'Não deu para salvar a anotação')),
  })
  const sessoes = useMutation({
    mutationFn: () => api.post<{ pessoas: number }>(`/plataforma/padarias/${d.id}/encerrar-sessoes`),
    onSuccess: (r) => toast.success(`${r.pessoas} pessoa(s) vão precisar entrar de novo`),
    onError: (e) => toast.error(mensagemErro(e, 'Não deu para encerrar as sessões')),
  })
  const precisaMotivo = acao === 'recusar' || acao === 'suspender'
  const n = d.numeros

  return (
    <>
      <section className="space-y-3 rounded-2xl border bg-muted/30 p-4">
        <h3 className="font-semibold">Decisão</h3>
        {d.status_motivo && (
          <p className="text-sm">
            <span className="text-muted-foreground">Motivo informado ao dono:</span> {d.status_motivo}
          </p>
        )}
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
                {BOTAO_ACAO[a]}
              </Button>
            ))}
            <Button variant="ghost" onClick={() => sessoes.mutate()} disabled={sessoes.isPending}>
              <LogOut className="size-4" />
              Encerrar todas as sessões
            </Button>
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
              autoFocus
              placeholder={
                acao === 'recusar'
                  ? 'Ex.: O CNPJ informado não confere com o cartão CNPJ enviado. Envie o cartão atualizado.'
                  : 'Ex.: Uso em desacordo com a Cláusula 4 do contrato.'
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={mudar.isPending || motivo.trim().length < 10}>
                {BOTAO_ACAO[acao]}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setAcao(null)}>
                <RotateCcw className="size-4" />
                Voltar
              </Button>
            </div>
          </form>
        )}
      </section>

      <Bloco titulo="Uso do sistema">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Numero rotulo="Faturamento em 30 dias" valor={formatBRL(n.faturamento_30_dias)} />
          <Numero rotulo="Faturamento total" valor={formatBRL(n.faturamento)} />
          <Numero rotulo="Vendas" valor={n.vendas.toLocaleString('pt-BR')} />
          <Numero rotulo="Produtos" valor={n.produtos} />
          <Numero rotulo="Encomendas" valor={n.encomendas} />
          <Numero rotulo="Última venda" valor={data(n.ultima_venda)} />
        </dl>
      </Bloco>

      <Bloco titulo="Anotações internas">
        <p className="text-xs text-muted-foreground">Só você vê. Use para lembrar conversas, combinados e pendências.</p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (nota.trim()) anotar.mutate()
          }}
        >
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={2000}
            placeholder="Ex.: Liguei para o dono em 04/11, vai mandar o alvará."
            aria-label="Nova anotação"
            className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="icon" aria-label="Salvar anotação" disabled={!nota.trim() || anotar.isPending}>
            <Send className="size-4" />
          </Button>
        </form>
        {d.notas.length > 0 && (
          <ul className="space-y-2">
            {d.notas.map((nt) => (
              <li key={nt.id} className="rounded-lg border bg-background px-3 py-2 text-sm">
                <p className="whitespace-pre-line">{nt.texto}</p>
                <p className="mt-1 text-xs text-muted-foreground">{dataHora(nt.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </Bloco>
    </>
  )
}

function Numero({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="mt-0.5 font-semibold tabular-nums">{valor}</dd>
    </div>
  )
}

function AbaPessoas({ d, aoMudar }: { d: Detalhe; aoMudar: () => void }) {
  const acesso = useMutation({
    mutationFn: (p: Pessoa) => api.post(`/plataforma/pessoas/${p.id}/acesso`, { ativo: !p.ativo }),
    onSuccess: (_r, p) => {
      toast.success(p.ativo ? `${p.nome} foi bloqueado(a)` : `${p.nome} pode entrar de novo`)
      aoMudar()
    },
    onError: (e) => toast.error(mensagemErro(e, 'Não deu para mudar o acesso')),
  })
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="py-2 pr-3 font-medium">Pessoa</th>
            <th className="py-2 pr-3 font-medium">Papel</th>
            <th className="py-2 pr-3 font-medium">CPF</th>
            <th className="py-2 pr-3 font-medium">Telefone</th>
            <th className="py-2 pr-3 font-medium">Último acesso</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {d.pessoas.map((p) => (
            <tr key={p.id} className={p.ativo ? undefined : 'text-muted-foreground'}>
              <td className="py-2 pr-3">
                <span className="block font-medium">{p.nome}</span>
                <span className="block text-xs text-muted-foreground">{p.email}</span>
              </td>
              <td className="py-2 pr-3">
                {ROTULO_PAPEL[p.papel] ?? p.papel}
                {!p.ativo && <span className="ml-1 text-xs text-destructive">(sem acesso)</span>}
              </td>
              <td className="py-2 pr-3">{p.cpf ? mascaraCPF(p.cpf) : '—'}</td>
              <td className="py-2 pr-3">{p.telefone ? mascaraTelefone(p.telefone) : '—'}</td>
              <td className="py-2 pr-3">{dataHora(p.ultimo_acesso)}</td>
              <td className="py-2 text-right">
                <Button variant="outline" size="sm" onClick={() => acesso.mutate(p)} disabled={acesso.isPending}>
                  {p.ativo ? 'Bloquear' : 'Liberar'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AbaDocumentos({ d }: { d: Detalhe }) {
  if (!d.documentos.length) return <p className="text-sm text-muted-foreground">Nenhum documento enviado.</p>
  return (
    <ul className="divide-y rounded-xl border">
      {d.documentos.map((doc) => (
        <li key={doc.id} className="flex items-center gap-3 px-4 py-3 text-sm">
          <FileText className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{doc.descricao}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {doc.nome_arquivo} · {Math.ceil(doc.tamanho / 1024)} KB · enviado em {dataHora(doc.created_at)}
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              baixar(`/api/plataforma/padarias/${d.id}/documentos/${doc.id}`, doc.nome_arquivo).catch((e) =>
                toast.error(mensagemErro(e, 'Não deu para baixar')),
              )
            }
          >
            <Download className="size-4" />
            Baixar
          </Button>
        </li>
      ))}
    </ul>
  )
}

function AbaLegal({ d }: { d: Detalhe }) {
  return (
    <>
      <Bloco titulo="Contrato assinado">
        {d.assinaturas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Contrato ainda não assinado.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {d.assinaturas.map((a) => (
              <li key={a.assinado_em} className="rounded-lg border px-3 py-2">
                Versão {a.versao}, assinado por <strong>{a.nome_assinado}</strong> ({a.email_conta}) em {dataHora(a.assinado_em)}
                <span className="block text-xs text-muted-foreground">IP {a.ip ?? '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </Bloco>
      <Bloco titulo={`Aceites dos Termos (${d.aceites.length})`}>
        <ul className="divide-y text-sm">
          {d.aceites.map((a) => (
            <li key={`${a.email}-${a.aceito_em}`} className="flex flex-wrap justify-between gap-2 py-2">
              <span>
                {a.nome} <span className="text-muted-foreground">({a.origem})</span>
              </span>
              <span className="text-muted-foreground">
                versão {a.versao} · {dataHora(a.aceito_em)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Dossiê completo para uma disputa: npm run provas -- e-mail</p>
      </Bloco>
    </>
  )
}

function AbaHistorico({ d }: { d: Detalhe }) {
  return (
    <>
      <Bloco titulo="Decisões da administração">
        {d.historico.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma decisão ainda.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {d.historico.map((h) => (
              <li key={`${h.acao}-${h.created_at}`} className="border-l-2 border-primary/40 pl-3">
                <span className="font-medium">{ROTULO_ACAO[h.acao] ?? h.acao}</span>
                {h.alvo && <span> ({h.alvo})</span>} em {dataHora(h.created_at)}
                {h.motivo && <span className="block text-muted-foreground">{h.motivo}</span>}
              </li>
            ))}
          </ol>
        )}
      </Bloco>
      <Bloco titulo="Acessos recentes">
        {d.acessos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum acesso registrado.</p>
        ) : (
          <ul className="divide-y text-sm">
            {d.acessos.map((a) => (
              <li key={`${a.created_at}-${a.email}`} className="flex flex-wrap justify-between gap-2 py-2">
                <span className={cn(a.evento !== 'login' && a.evento !== 'entrou_com_codigo' && 'text-destructive')}>
                  {ROTULO_EVENTO[a.evento] ?? a.evento} <span className="text-muted-foreground">{a.email}</span>
                </span>
                <span className="text-muted-foreground">
                  {dataHora(a.created_at)} · IP {a.ip ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Bloco>
    </>
  )
}
