import { BookOpen, Check, ChevronDown, Copy, Mail, MessageCircleQuestion, Scale, SendHorizontal, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthContext'
import { buscarAjuda, respostaRapida, sugestoesIniciais, type ItemAjuda } from '@/features/ajuda/assistente'
import { duvidas } from '@/features/guia/guias'
import { usePadaria } from '@/features/padaria/api'
import { empresa } from '@/lib/empresa'
import { papelLabels } from '@/lib/permissoes'
import { cn } from '@/lib/utils'

type Aba = 'assistente' | 'perguntas' | 'suporte'

type Mensagem =
  | { de: 'pessoa'; texto: string }
  | { de: 'assistente'; texto: string; itens?: ItemAjuda[]; semResposta?: boolean }

const ABAS = [
  ['assistente', 'Assistente'],
  ['perguntas', 'Perguntas'],
  ['suporte', 'Suporte'],
] as const satisfies readonly (readonly [Aba, string])[]

const rotuloTipo: Record<ItemAjuda['tipo'], string> = {
  pergunta: 'Pergunta frequente',
  guia: 'Guia passo a passo',
  lei: 'Leis e boas práticas',
  dica: 'Dica',
}

// Botão "Dúvidas?" no canto da tela do Guia: assistente, perguntas frequentes e contato por e-mail.
export function BotaoDuvidas() {
  const [aberto, setAberto] = useState(false)
  const [aba, setAba] = useState<Aba>('assistente')
  const painelRef = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)

  // Ao abrir, o foco entra no painel (aba ativa): quem usa teclado começa por ali.
  useEffect(() => {
    if (aberto) painelRef.current?.querySelector<HTMLElement>('[role=tab][aria-selected=true]')?.focus()
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false)
        botaoRef.current?.focus()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  return (
    <>
      {aberto && (
        <div
          ref={painelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Central de dúvidas"
          className="duvidas-painel fixed inset-x-2 bottom-20 z-40 flex max-h-[min(640px,calc(100svh-6.5rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[400px]"
        >
          <header className="flex items-center gap-3 bg-[#3b2414] px-4 py-3 text-[#fff6e8]">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-200">
              <MessageCircleQuestion className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-base leading-tight font-semibold">Central de dúvidas</p>
              <p className="text-xs text-[#fff6e8]/70">Respostas na hora ou direto com o suporte</p>
            </div>
            <button
              type="button"
              aria-label="Fechar a central de dúvidas"
              onClick={() => {
                setAberto(false)
                botaoRef.current?.focus()
              }}
              className="flex size-10 items-center justify-center rounded-lg text-[#fff6e8]/80 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
            >
              <X className="size-5" />
            </button>
          </header>

          <div
            role="tablist"
            aria-label="Formas de ajuda"
            className="grid grid-cols-3 border-b bg-muted/40 p-1 text-sm"
            onKeyDown={(e) => {
              // Setas trocam de aba, como em qualquer lista de abas.
              const i = ABAS.findIndex(([v]) => v === aba)
              const proxima = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null
              if (proxima === null) return
              e.preventDefault()
              const valor = ABAS[(proxima + ABAS.length) % ABAS.length][0]
              setAba(valor)
              requestAnimationFrame(() => document.getElementById(`duvidas-aba-${valor}`)?.focus())
            }}
          >
            {ABAS.map(([valor, rotulo]) => (
              <button
                key={valor}
                id={`duvidas-aba-${valor}`}
                type="button"
                role="tab"
                aria-selected={aba === valor}
                aria-controls="duvidas-conteudo"
                tabIndex={aba === valor ? 0 : -1}
                onClick={() => setAba(valor)}
                className={cn(
                  'rounded-lg px-2 py-1.5 font-medium transition-colors',
                  aba === valor ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <div
            id="duvidas-conteudo"
            role="tabpanel"
            aria-labelledby={`duvidas-aba-${aba}`}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            {aba === 'assistente' && <Assistente irParaSuporte={() => setAba('suporte')} />}
            {aba === 'perguntas' && <Perguntas />}
            {aba === 'suporte' && <Suporte />}
          </div>
        </div>
      )}

      <button
        ref={botaoRef}
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#3b2414] py-3 pr-5 pl-4 font-semibold text-[#fff6e8] shadow-[0_12px_30px_-8px_rgba(59,36,20,.7)] ring-2 ring-amber-400/60 transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:outline-none sm:right-5 sm:bottom-5"
      >
        {aberto ? <ChevronDown className="size-5" /> : <MessageCircleQuestion className="size-5 text-amber-300" />}
        Dúvidas?
      </button>
    </>
  )
}

function Assistente({ irParaSuporte }: { irParaSuporte: () => void }) {
  const { user } = useAuth()
  const papel = user?.papel ?? 'funcionario'
  const primeiroNome = user?.nome?.split(' ')[0] ?? ''
  const [texto, setTexto] = useState('')
  const [conversa, setConversa] = useState<Mensagem[]>(() => [
    {
      de: 'assistente',
      texto: `Oi${primeiroNome ? `, ${primeiroNome}` : ''}! Eu procuro a resposta nos guias, nas perguntas frequentes e nas leis da padaria. Pergunte do seu jeito.`,
    },
  ])
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [conversa])

  const perguntar = (pergunta: string) => {
    const p = pergunta.trim()
    if (!p) return
    const rapida = respostaRapida(p, primeiroNome)
    const itens = rapida ? [] : buscarAjuda(p, papel)
    const resposta: Mensagem = rapida
      ? { de: 'assistente', texto: rapida }
      : itens.length
        ? { de: 'assistente', texto: 'Encontrei isto:', itens }
        : {
            de: 'assistente',
            texto: 'Não encontrei uma resposta para isso aqui no sistema. Mande a sua dúvida para o suporte: a resposta chega no seu e-mail.',
            semResposta: true,
          }
    setConversa((c) => [...c.slice(-30), { de: 'pessoa', texto: p }, resposta])
    setTexto('')
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    perguntar(texto)
  }

  const sugestoes = sugestoesIniciais[papel === 'funcionario' ? 'equipe' : 'gestao']

  return (
    <div className="flex h-full min-h-[360px] flex-col">
      {/* Leitor de tela: anuncia só a resposta nova, não a conversa inteira. */}
      <p className="sr-only" aria-live="polite">
        {(() => {
          const ultima = conversa[conversa.length - 1]
          if (conversa.length === 1 || ultima.de !== 'assistente') return ''
          return [ultima.texto, ...(ultima.itens ?? []).map((it) => `${it.titulo}. ${it.resposta}`)].join(' ')
        })()}
      </p>
      <div className="flex-1 space-y-3 p-4">
        {conversa.map((m, i) =>
          m.de === 'pessoa' ? (
            <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">
              {m.texto}
            </p>
          ) : (
            <div key={i} className="max-w-[92%] space-y-2">
              <p className="flex gap-2 text-sm">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <span>{m.texto}</span>
              </p>
              {m.itens?.map((item) => <CartaoResposta key={item.id} item={item} />)}
              {m.semResposta && (
                <Button type="button" size="sm" variant="outline" onClick={irParaSuporte}>
                  <Mail className="size-4" />
                  Falar com o suporte
                </Button>
              )}
            </div>
          ),
        )}
        {conversa.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {sugestoes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => perguntar(s)}
                className="rounded-full border bg-background px-3 py-1.5 text-left text-sm hover:border-primary/60 hover:bg-primary/5"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={fimRef} />
      </div>
      <form onSubmit={enviar} className="sticky bottom-0 flex gap-2 border-t bg-card p-3">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva a sua dúvida"
          aria-label="Sua dúvida"
          maxLength={300}
        />
        <Button type="submit" size="icon" aria-label="Perguntar" disabled={!texto.trim()}>
          <SendHorizontal className="size-4" />
        </Button>
      </form>
    </div>
  )
}

function CartaoResposta({ item }: { item: ItemAjuda }) {
  const Icone = item.tipo === 'lei' ? Scale : item.tipo === 'guia' ? BookOpen : MessageCircleQuestion
  return (
    <article className="space-y-1.5 rounded-xl border bg-background p-3 text-sm">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icone className="size-3.5" />
        {rotuloTipo[item.tipo]}
      </p>
      <p className="font-semibold leading-snug">{item.titulo}</p>
      <p className="text-foreground/85">{item.resposta}</p>
      {item.passos && item.passos.length > 0 && (
        <ol className="list-decimal space-y-1 pl-5 text-foreground/85">
          {item.passos.slice(0, 4).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      )}
      {item.link && (
        <Link to={item.link.to} className="inline-block font-medium text-primary underline-offset-2 hover:underline">
          {item.link.label}
        </Link>
      )}
    </article>
  )
}

function Perguntas() {
  const { user } = useAuth()
  const papel = user?.papel ?? 'funcionario'
  const [aberta, setAberta] = useState<number | null>(null)
  const lista = useMemo(() => duvidas.filter((d) => d.papeis.includes(papel)), [papel])
  return (
    <ul className="divide-y">
      {lista.map((d, i) => (
        <li key={d.pergunta}>
          <button
            type="button"
            aria-expanded={aberta === i}
            onClick={() => setAberta(aberta === i ? null : i)}
            className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-muted/50"
          >
            {d.pergunta}
            <ChevronDown className={cn('mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform', aberta === i && 'rotate-180')} />
          </button>
          {aberta === i && <p className="px-4 pb-3 text-sm text-foreground/80">{d.resposta}</p>}
        </li>
      ))}
    </ul>
  )
}

function Suporte() {
  const { user } = useAuth()
  const padaria = usePadaria().data
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [copiado, setCopiado] = useState(false)

  const nomePadaria = padaria?.nome_fantasia?.trim() || 'minha padaria'
  // O e-mail sai do aplicativo de e-mail da própria pessoa: o Coffee Break não guarda a mensagem.
  const link = useMemo(() => {
    const corpo = [
      mensagem.trim(),
      '',
      '---',
      `Nome: ${user?.nome ?? ''}`,
      `Padaria: ${nomePadaria}`,
      `Papel: ${user ? papelLabels[user.papel] : ''}`,
      `Tela: ${window.location.pathname}`,
    ].join('\n')
    const titulo = `[Coffee Break] ${assunto.trim() || 'Dúvida'} — ${nomePadaria}`
    return `mailto:${empresa.email}?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(corpo)}`
  }, [assunto, mensagem, nomePadaria, user])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(empresa.email)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* sem permissão de área de transferência: o e-mail continua visível na tela */
    }
  }

  return (
    <div className="space-y-4 p-4 text-sm">
      <p className="text-foreground/80">
        Escreva a sua dúvida. Ao tocar em "Abrir meu e-mail", a mensagem vai pronta para o seu aplicativo de e-mail, e a
        resposta chega na sua caixa de entrada.
      </p>
      <div className="space-y-1.5">
        <label htmlFor="duvida-assunto" className="font-medium">
          Assunto
        </label>
        <Input
          id="duvida-assunto"
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          placeholder="Ex.: promoção não aparece no PDV"
          maxLength={80}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="duvida-mensagem" className="font-medium">
          Sua dúvida
        </label>
        <textarea
          id="duvida-mensagem"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Conte o que aconteceu e o que você esperava."
          className="w-full resize-y rounded-lg border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-xs text-muted-foreground">Não envie senhas nem dados de cartão.</p>
      </div>
      <Button asChild className="w-full" disabled={!mensagem.trim()}>
        <a href={mensagem.trim() ? link : undefined} aria-disabled={!mensagem.trim()}>
          <Mail className="size-4" />
          Abrir meu e-mail
        </a>
      </Button>
      <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <span className="min-w-0 truncate">
          Ou escreva para <strong className="select-all">{empresa.email}</strong>
        </span>
        <button type="button" onClick={copiar} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline">
          {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Respondemos em dias úteis. O Coffee Break não guarda a sua mensagem.</p>
    </div>
  )
}
