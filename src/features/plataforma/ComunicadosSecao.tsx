import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Megaphone } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { mensagemErro } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Cartao, dataHora, Vazio } from '@/features/plataforma/comum'

interface Comunicado {
  id: string
  titulo: string
  texto: string
  tom: 'info' | 'aviso' | 'novidade'
  publico: 'todos' | 'donos' | 'gestao'
  ativo: boolean
  expira_em: string | null
  created_at: string
}

const TONS = { info: 'Informação', aviso: 'Aviso importante', novidade: 'Novidade' } as const
const PUBLICOS = { todos: 'Todo mundo', gestao: 'Donos e gerentes', donos: 'Só os donos' } as const
const COR_TOM = {
  info: 'border-sky-300/70 bg-sky-50 text-sky-950 dark:bg-sky-950/30 dark:text-sky-100',
  aviso: 'border-amber-300/80 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100',
  novidade: 'border-emerald-300/70 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100',
}

// Avisos para as padarias: aparecem numa faixa no topo do sistema de todo mundo.
export function ComunicadosSecao() {
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [tom, setTom] = useState<Comunicado['tom']>('info')
  const [publico, setPublico] = useState<Comunicado['publico']>('todos')
  const [dias, setDias] = useState('7')
  const lista = useQuery({ queryKey: ['plataforma', 'comunicados'], queryFn: () => api.get<Comunicado[]>('/plataforma/comunicados') })
  const atualizar = () => {
    void queryClient.invalidateQueries({ queryKey: ['plataforma', 'comunicados'] })
    void queryClient.invalidateQueries({ queryKey: ['comunicados'] })
  }
  const publicar = useMutation({
    mutationFn: () =>
      api.post('/plataforma/comunicados', {
        titulo: titulo.trim(),
        texto: texto.trim(),
        tom,
        publico,
        expira_em: dias === 'sempre' ? null : new Date(Date.now() + Number(dias) * 86_400_000).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Comunicado publicado')
      setTitulo('')
      setTexto('')
      atualizar()
    },
    onError: (e) => toast.error(mensagemErro(e, 'Não deu para publicar')),
  })
  const alternar = useMutation({
    mutationFn: (c: Comunicado) => api.patch(`/plataforma/comunicados/${c.id}`, { ativo: !c.ativo }),
    onSuccess: atualizar,
    onError: (e) => toast.error(mensagemErro(e, 'Não deu para mudar o comunicado')),
  })
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    publicar.mutate()
  }
  const vigente = (c: Comunicado) => c.ativo && (!c.expira_em || new Date(c.expira_em) > new Date())

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Cartao className="space-y-4 self-start">
        <h2 className="flex items-center gap-2 font-semibold">
          <Megaphone className="size-5 text-primary" />
          Novo comunicado
        </h2>
        <form onSubmit={enviar} className="space-y-3 text-sm">
          <label className="block space-y-1.5">
            <span className="font-medium">Título</span>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120} placeholder="Ex.: Manutenção no domingo às 23h" />
          </label>
          <label className="block space-y-1.5">
            <span className="font-medium">Mensagem</span>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={4}
              maxLength={600}
              placeholder="O sistema fica fora do ar por até 15 minutos. As vendas feitas antes continuam salvas."
              className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Seletor rotulo="Tipo" valor={tom} opcoes={TONS} aoMudar={(v) => setTom(v as Comunicado['tom'])} />
            <Seletor rotulo="Para quem" valor={publico} opcoes={PUBLICOS} aoMudar={(v) => setPublico(v as Comunicado['publico'])} />
            <Seletor rotulo="Aparece por" valor={dias} opcoes={{ '1': '1 dia', '7': '7 dias', '30': '30 dias', sempre: 'Até encerrar' }} aoMudar={setDias} />
          </div>
          {(titulo.trim() || texto.trim()) && (
            <div className={cn('rounded-xl border px-4 py-3', COR_TOM[tom])}>
              <p className="font-semibold">{titulo || 'Título'}</p>
              <p className="whitespace-pre-line opacity-90">{texto || 'Mensagem'}</p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={publicar.isPending || titulo.trim().length < 3 || texto.trim().length < 5}>
            Publicar para as padarias
          </Button>
        </form>
      </Cartao>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold">Publicados</h2>
        {lista.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !lista.data?.length ? (
          <Vazio>Nenhum comunicado ainda. O primeiro aparece no topo do sistema de todas as padarias.</Vazio>
        ) : (
          <ul className="divide-y">
            {lista.data.map((c) => (
              <li key={c.id} className="flex items-start gap-4 px-5 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.titulo}</p>
                  <p className="text-muted-foreground">{c.texto}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {TONS[c.tom]} · {PUBLICOS[c.publico]} · {dataHora(c.created_at)}
                    {c.expira_em && ` · até ${dataHora(c.expira_em)}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', vigente(c) ? 'bg-emerald-500/15 text-emerald-800' : 'bg-muted text-muted-foreground')}>
                    {vigente(c) ? 'No ar' : 'Encerrado'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => alternar.mutate(c)} disabled={alternar.isPending}>
                    {c.ativo ? 'Encerrar' : 'Republicar'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Seletor({
  rotulo,
  valor,
  opcoes,
  aoMudar,
}: {
  rotulo: string
  valor: string
  opcoes: Record<string, string>
  aoMudar: (v: string) => void
}) {
  return (
    <label className="block space-y-1.5">
      <span className="font-medium">{rotulo}</span>
      <select
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="h-9 w-full rounded-lg border bg-background px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {Object.entries(opcoes).map(([v, r]) => (
          <option key={v} value={v}>
            {r}
          </option>
        ))}
      </select>
    </label>
  )
}
