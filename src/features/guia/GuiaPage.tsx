import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  HeartHandshake,
  Lightbulb,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthContext'
import { usePadaria } from '@/features/padaria/api'
import { VideoApresentacao } from '@/features/guia/VideoApresentacao'
import { mascaraTelefone } from '@/lib/documentos'
import { papelLabels } from '@/lib/permissoes'
import { cn } from '@/lib/utils'
import { BotaoDuvidas } from '@/features/ajuda/BotaoDuvidas'
import { NovidadesENoticias } from '@/features/ajuda/NovidadesENoticias'
import { categorias, duvidas, guias, todos, type Categoria, type Publico } from '@/features/guia/guias'

// "Já aprendi": cada pessoa marca no próprio aparelho. Falhar em ler/gravar não atrapalha o guia.
function useAprendidos(usuarioId: string | undefined) {
  const chave = `coffee-break:guia-aprendidos:${usuarioId ?? 'anonimo'}`
  const [aprendidos, setAprendidos] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(chave) ?? '[]') as string[])
    } catch {
      return new Set()
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify([...aprendidos]))
    } catch {
      // Sem armazenamento (aba anônima): a marcação vale só nesta visita.
    }
  }, [chave, aprendidos])
  const alternar = (id: string) =>
    setAprendidos((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  return { aprendidos, alternar }
}

const semAcento = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function GuiaPage() {
  const { user } = useAuth()
  const papel = user?.papel ?? 'funcionario'
  const primeiroNome = user?.nome?.split(' ')[0] ?? ''
  const padaria = usePadaria().data
  const { aprendidos, alternar } = useAprendidos(user?.id)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<Categoria | 'todas'>('todas')
  const [aberto, setAberto] = useState<string | null>(null)
  // Dono e gerente escolhem entre os guias deles e os da equipe; o funcionário vê só os da equipe.
  const gestor = papel !== 'funcionario'
  const [publico, setPublico] = useState<Publico>(gestor ? 'gestao' : 'equipe')

  const doPapel = useMemo(
    () => guias.filter((g) => g.papeis.includes(papel) && g.publico === publico),
    [papel, publico],
  )
  const proximo = doPapel.find((g) => !aprendidos.has(g.id))
  const feitos = doPapel.filter((g) => aprendidos.has(g.id)).length
  const pct = doPapel.length ? Math.round((feitos / doPapel.length) * 100) : 0

  const termo = semAcento(busca.trim())
  const visiveis = doPapel.filter(
    (g) =>
      (categoria === 'todas' || g.categoria === categoria) &&
      (!termo || semAcento([g.titulo, g.resumo, ...g.passos, ...g.dicas].join(' ')).includes(termo)),
  )
  const duvidasVisiveis = duvidas.filter(
    (d) => d.papeis.includes(papel) && (!termo || semAcento(d.pergunta + ' ' + d.resposta).includes(termo)),
  )
  const categoriasDoPapel = (Object.keys(categorias) as Categoria[]).filter((c) =>
    doPapel.some((g) => g.categoria === c),
  )

  const contato = padaria?.whatsapp || padaria?.telefone

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {primeiroNome ? `Olá, ${primeiroNome}! Vamos aprender juntos?` : 'Guia e dicas'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tudo o que você precisa para o dia a dia como {papelLabels[papel].toLowerCase()}, no seu
          ritmo. Ninguém nasce sabendo: volte aqui sempre que tiver dúvida.
        </p>
      </header>

      {gestor && (
        <div className="grid gap-2 rounded-xl border bg-card p-1.5 shadow-sm sm:grid-cols-2" role="tablist">
          {(
            [
              ['gestao', 'Para donos e gerentes', 'Produtos, preços, promoções, números e equipe'],
              ['equipe', 'Para a equipe da padaria', 'Balcão, caixa, encomendas, estoque e produção'],
            ] as const
          ).map(([valor, titulo, sub]) => (
            <button
              key={valor}
              type="button"
              role="tab"
              aria-selected={publico === valor}
              onClick={() => {
                setPublico(valor)
                setCategoria('todas')
                setAberto(null)
              }}
              className={cn(
                'rounded-lg px-4 py-2.5 text-left transition-colors',
                publico === valor ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted/60',
              )}
            >
              <span className="block text-sm font-semibold">{titulo}</span>
              <span className={cn('block text-xs', publico === valor ? 'opacity-85' : 'text-muted-foreground')}>
                {sub}
              </span>
            </button>
          ))}
        </div>
      )}

      <VideoApresentacao publico={publico} />

      {/* Progresso e próximo passo sugerido */}
      <section className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium">
            {feitos === doPapel.length
              ? 'Você já viu todos os guias. Parabéns!'
              : `Você já aprendeu ${feitos} de ${doPapel.length} guias`}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {proximo && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setBusca('')
              setCategoria('todas')
              setAberto(proximo.id)
              document.getElementById(`guia-${proximo.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            Próximo: {proximo.titulo.split(':')[0]}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </section>

      {/* Busca e categorias */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="guia-busca"
            value={busca}
            onChange={(e) => {
              const texto = e.target.value
              setBusca(texto)
              // Ao procurar, o primeiro guia encontrado já abre; os outros abrem e fecham no clique.
              const t = semAcento(texto.trim())
              const primeiro = t
                ? doPapel.find(
                    (g) =>
                      (categoria === 'todas' || g.categoria === categoria) &&
                      semAcento([g.titulo, g.resumo, ...g.passos, ...g.dicas].join(' ')).includes(t),
                  )
                : undefined
              setAberto(primeiro?.id ?? null)
            }}
            placeholder='Procure uma dúvida: "troco", "senha", "bolo", "promoção"...'
            className="pl-9"
            aria-label="Procurar no guia"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['todas', ...categoriasDoPapel] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                categoria === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:border-primary/60',
              )}
            >
              {c === 'todas' ? 'Todos' : categorias[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Guias em sanfona */}
      <div className="space-y-3">
        {visiveis.length === 0 && duvidasVisiveis.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nada encontrado para "{busca}". Tente outra palavra ou pergunte ao responsável pela padaria.
          </p>
        )}
        {visiveis.map((guia) => {
          const estaAberto = aberto === guia.id
          const aprendeu = aprendidos.has(guia.id)
          return (
            <article
              key={guia.id}
              id={`guia-${guia.id}`}
              className={cn(
                'scroll-mt-4 overflow-hidden rounded-xl border bg-card shadow-sm transition-colors',
                estaAberto && 'border-primary/40',
              )}
            >
              <button
                type="button"
                onClick={() => setAberto(estaAberto ? null : guia.id)}
                aria-expanded={estaAberto}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/40"
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    aprendeu ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-primary',
                  )}
                >
                  {aprendeu ? <Check className="size-4" /> : <guia.icone className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    {guia.titulo}
                    {guia.papeis.length < todos.length && (
                      <Badge variant="outline" className="font-normal">
                        {guia.papeis.map((p) => papelLabels[p]).join(' e ')}
                      </Badge>
                    )}
                  </span>
                  <span className="block text-sm text-muted-foreground">{guia.resumo}</span>
                </span>
                <ChevronDown
                  className={cn('size-4 shrink-0 text-muted-foreground transition-transform', estaAberto && 'rotate-180')}
                />
              </button>
              {estaAberto && (
                <div className="space-y-4 border-t px-4 pt-4 pb-4 text-sm sm:px-5">
                  <ol className="space-y-2">
                    {guia.passos.map((passo, i) => (
                      <li key={passo} className="flex gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{passo}</span>
                      </li>
                    ))}
                  </ol>
                  <ul className="space-y-1.5 rounded-lg bg-muted/50 p-3">
                    {guia.dicas.map((dica) => (
                      <li key={dica} className="flex gap-2 text-muted-foreground">
                        <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                        {dica}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-2">
                    {guia.link && (
                      <Button asChild size="sm">
                        <Link to={guia.link.to}>
                          {guia.link.label}
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant={aprendeu ? 'secondary' : 'outline'}
                      onClick={() => {
                        alternar(guia.id)
                        if (!aprendeu) setAberto(null)
                      }}
                    >
                      <Check className="size-4" />
                      {aprendeu ? 'Aprendido (desmarcar)' : 'Já aprendi'}
                    </Button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {/* Dúvidas comuns */}
      {duvidasVisiveis.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <CircleHelp className="size-5 text-primary" />
            Dúvidas comuns
          </h2>
          <div className="divide-y rounded-xl border bg-card shadow-sm">
            {duvidasVisiveis.map((d) => (
              <details key={d.pergunta} className="group px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                  {d.pergunta}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{d.resposta}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <NovidadesENoticias />

      {/* Precisa de ajuda? */}
      <section className="flex flex-wrap items-start gap-4 rounded-xl border bg-secondary/60 p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary shadow-sm">
          <HeartHandshake className="size-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1 text-sm">
          <h2 className="font-heading text-lg font-semibold">Precisa de ajuda?</h2>
          {papel === 'dono' ? (
            <p className="text-muted-foreground">
              Mostre este guia e o vídeo para cada pessoa da equipe no primeiro dia: começar sabendo
              o caminho evita erro no caixa e no estoque. Algo deu errado? A mensagem aparece no
              canto da tela: tire um print para não perder os detalhes.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Ficou com dúvida ou algo deu errado? Fale com o responsável pela padaria
              {contato ? (
                <>
                  {' '}
                  pelo número <strong className="text-foreground">{mascaraTelefone(contato)}</strong>
                </>
              ) : null}
              . Se aparecer uma mensagem de erro no canto da tela, tire um print: ajuda a resolver
              mais rápido. Perguntar nunca é demais!
            </p>
          )}
        </div>
      </section>
      <BotaoDuvidas />
    </div>
  )
}
