import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Clock, FileText, Loader2, LogOut, RefreshCw, ShieldAlert, Trash2, Upload, XCircle } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { LogoPao } from '@/components/LogoPao'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import { empresa } from '@/lib/empresa'
import { mensagemErro } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Documento {
  id: string
  descricao: string
  nome_arquivo: string
  tipo: string
  tamanho: number
  created_at: string
}

interface Situacao {
  status: 'pendente' | 'aprovada' | 'recusada' | 'suspensa'
  motivo: string | null
  status_em: string | null
  cadastrada_em: string
  padaria: { nome_fantasia: string | null; razao_social: string | null; cnpj: string | null }
  contrato_assinado: boolean
  documentos: Documento[]
  limite_documentos: number
}

const TIPOS_DOCUMENTO = [
  'Cartão CNPJ',
  'Alvará de funcionamento',
  'Documento com foto do responsável',
  'Comprovante de endereço da padaria',
  'Outro documento',
]

const LIMITE = 3 * 1024 * 1024

function lerComoBase64(arquivo: File) {
  return new Promise<string>((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result))
    leitor.onerror = () => reject(new Error('Não deu para ler o arquivo'))
    leitor.readAsDataURL(arquivo)
  })
}

const tamanhoLegivel = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`)

// Antes da liberação pela administração do Coffee Break, a padaria vê só esta tela: a situação
// da análise, os documentos enviados e o que fazer em seguida.
export function TelaLiberacao() {
  const { user, signOut, atualizarUsuario } = useAuth()
  const queryClient = useQueryClient()
  const dono = user?.papel === 'dono'
  const situacao = useQuery({
    queryKey: ['liberacao'],
    queryFn: () => api.get<Situacao>('/liberacao'),
    refetchInterval: 60_000,
  })
  const status = situacao.data?.status

  // Liberou enquanto a tela estava aberta: entra no sistema sozinho.
  useEffect(() => {
    if (status === 'aprovada') void atualizarUsuario()
  }, [status, atualizarUsuario])

  const novaAnalise = useMutation({
    mutationFn: () => api.post('/liberacao/nova-analise'),
    onSuccess: () => {
      toast.success('Pedido de nova análise enviado')
      void queryClient.invalidateQueries({ queryKey: ['liberacao'] })
    },
    onError: (e) => toast.error(mensagemErro(e, 'Não deu para concluir. Tente de novo.')),
  })

  const nome = situacao.data?.padaria.nome_fantasia || 'sua padaria'
  const docs = situacao.data?.documentos ?? []
  const podeEnviar = dono && (status === 'pendente' || status === 'recusada')

  return (
    <div className="fundo-padaria fixed inset-0 z-40 overflow-y-auto px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="flex items-center gap-3">
          <LogoPao className="size-10" />
          <p className="flex-1 font-heading text-xl font-semibold">Coffee Break</p>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut className="size-4" />
            Sair
          </Button>
        </header>

        {!situacao.data ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
              <Cabecalho status={situacao.data.status} nome={nome} dono={dono} />
              {situacao.data.motivo && (status === 'recusada' || status === 'suspensa') && (
                <div className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                  <p className="font-semibold">Mensagem da equipe do Coffee Break</p>
                  <p className="mt-1 whitespace-pre-line">{situacao.data.motivo}</p>
                </div>
              )}

              <ol className="space-y-3">
                <Etapa feita titulo="Cadastro enviado" detalhe={new Date(situacao.data.cadastrada_em).toLocaleDateString('pt-BR')} />
                <Etapa feita={situacao.data.contrato_assinado} titulo="Contrato assinado" />
                <Etapa
                  feita={docs.length > 0}
                  titulo="Documentos enviados"
                  detalhe={docs.length ? `${docs.length} arquivo(s)` : dono ? 'Envie abaixo' : 'O responsável envia'}
                />
                <Etapa
                  feita={status === 'aprovada'}
                  atual={status === 'pendente'}
                  falhou={status === 'recusada' || status === 'suspensa'}
                  titulo="Análise do Coffee Break"
                  detalhe={status === 'pendente' ? 'Em andamento' : status === 'recusada' ? 'Precisa de ajustes' : status === 'suspensa' ? 'Suspensa' : 'Liberada'}
                />
              </ol>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    await situacao.refetch()
                    await atualizarUsuario()
                  }}
                  disabled={situacao.isFetching}
                >
                  <RefreshCw className={cn('size-4', situacao.isFetching && 'animate-spin')} />
                  Ver se já foi liberada
                </Button>
                {dono && status === 'recusada' && (
                  <Button onClick={() => novaAnalise.mutate()} disabled={novaAnalise.isPending}>
                    Pedir nova análise
                  </Button>
                )}
              </div>
            </section>

            {dono && (
              <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
                <div>
                  <h2 className="font-heading text-lg font-semibold">Documentos da padaria</h2>
                  <p className="text-sm text-muted-foreground">
                    Ajudam a confirmar que a padaria existe e que você é o responsável. Envie o cartão CNPJ e um
                    documento com foto; o alvará também ajuda.
                  </p>
                </div>
                {docs.length > 0 && (
                  <ul className="divide-y rounded-xl border">
                    {docs.map((d) => (
                      <LinhaDocumento key={d.id} doc={d} podeApagar={podeEnviar} />
                    ))}
                  </ul>
                )}
                {podeEnviar && docs.length < (situacao.data.limite_documentos ?? 10) && <EnviarDocumento />}
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, PNG ou WEBP, até 3 MB cada. Os documentos servem só para a análise da padaria (Política de
                  Privacidade, itens 3 e 9).
                </p>
              </section>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Dúvidas sobre a liberação? Escreva para <strong className="select-all text-foreground">{empresa.email}</strong>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function Cabecalho({ status, nome, dono }: { status: Situacao['status']; nome: string; dono: boolean }) {
  const conteudo = {
    pendente: {
      icone: Clock,
      cor: 'bg-amber-500/15 text-amber-700',
      titulo: `${nome} está em análise`,
      texto: dono
        ? 'Recebemos o seu cadastro. A equipe do Coffee Break confere os dados e os documentos e libera o acesso. Esta tela se atualiza sozinha: assim que liberar, o sistema abre.'
        : 'O cadastro da padaria está sendo conferido pela equipe do Coffee Break. Assim que for liberado, o sistema abre para você.',
    },
    recusada: {
      icone: XCircle,
      cor: 'bg-destructive/10 text-destructive',
      titulo: 'O cadastro precisa de ajustes',
      texto: dono
        ? 'Veja a mensagem abaixo, envie o que faltou e peça uma nova análise.'
        : 'O responsável pela padaria precisa ajustar o cadastro. Fale com ele.',
    },
    suspensa: {
      icone: ShieldAlert,
      cor: 'bg-destructive/10 text-destructive',
      titulo: 'O acesso desta padaria está suspenso',
      texto: 'Os dados continuam guardados. Para entender o motivo ou contestar, fale com o suporte do Coffee Break.',
    },
    aprovada: {
      icone: Check,
      cor: 'bg-emerald-500/15 text-emerald-700',
      titulo: 'Padaria liberada!',
      texto: 'Abrindo o sistema…',
    },
  }[status]
  const Icone = conteudo.icone
  return (
    <div className="flex gap-4">
      <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl', conteudo.cor)}>
        <Icone className="size-6" />
      </span>
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">{conteudo.titulo}</h1>
        <p className="text-sm text-muted-foreground">{conteudo.texto}</p>
      </div>
    </div>
  )
}

function Etapa({
  titulo,
  detalhe,
  feita = false,
  atual = false,
  falhou = false,
}: {
  titulo: string
  detalhe?: string
  feita?: boolean
  atual?: boolean
  falhou?: boolean
}) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full border-2',
          feita && 'border-emerald-600 bg-emerald-600 text-white',
          atual && 'border-amber-500 text-amber-600',
          falhou && 'border-destructive text-destructive',
          !feita && !atual && !falhou && 'border-muted-foreground/30 text-muted-foreground',
        )}
      >
        {feita ? <Check className="size-4" /> : falhou ? <XCircle className="size-4" /> : atual ? <Clock className="size-4" /> : null}
      </span>
      <span className="flex-1 font-medium">{titulo}</span>
      {detalhe && <span className="text-muted-foreground">{detalhe}</span>}
    </li>
  )
}

function LinhaDocumento({ doc, podeApagar }: { doc: Documento; podeApagar: boolean }) {
  const queryClient = useQueryClient()
  const apagar = useMutation({
    mutationFn: () => api.delete(`/liberacao/documentos/${doc.id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['liberacao'] }),
    onError: (e) => toast.error(mensagemErro(e, 'Não deu para concluir. Tente de novo.')),
  })
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 text-sm">
      <FileText className="size-5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{doc.descricao}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {doc.nome_arquivo} · {tamanhoLegivel(doc.tamanho)}
        </span>
      </span>
      {podeApagar && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Apagar ${doc.descricao}`}
          onClick={() => apagar.mutate()}
          disabled={apagar.isPending}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </li>
  )
}

function EnviarDocumento() {
  const queryClient = useQueryClient()
  const [descricao, setDescricao] = useState(TIPOS_DOCUMENTO[0])
  const [arquivo, setArquivo] = useState<File | null>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const enviar = useMutation({
    mutationFn: async () => {
      if (!arquivo) throw new Error('Escolha o arquivo')
      if (arquivo.size > LIMITE) throw new Error('Arquivo grande demais: envie até 3 MB.')
      return api.post('/liberacao/documentos', {
        descricao,
        nome_arquivo: arquivo.name,
        conteudo: await lerComoBase64(arquivo),
      })
    },
    onSuccess: () => {
      toast.success('Documento enviado')
      setArquivo(null)
      if (entrada.current) entrada.current.value = ''
      void queryClient.invalidateQueries({ queryKey: ['liberacao'] })
    },
    onError: (e) => toast.error(mensagemErro(e, 'Não deu para concluir. Tente de novo.')),
  })
  const aoEnviar = (e: FormEvent) => {
    e.preventDefault()
    enviar.mutate()
  }
  return (
    <form onSubmit={aoEnviar} className="grid gap-3 rounded-xl border border-dashed p-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="space-y-3">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Que documento é</span>
          <select
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Arquivo</span>
          <input
            ref={entrada}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary"
          />
        </label>
      </div>
      <Button type="submit" disabled={!arquivo || enviar.isPending}>
        {enviar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        Enviar
      </Button>
    </form>
  )
}
