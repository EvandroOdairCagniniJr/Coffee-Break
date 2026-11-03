import { ChefHat, ChevronRight, Lightbulb, Scale, ShieldAlert, TrendingUp, X, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { dicasDaTela, tiposDica, type Tela, type TipoDica } from '@/features/saber/conteudo'
import { cn } from '@/lib/utils'

const icones: Record<TipoDica, LucideIcon> = {
  lei: Scale,
  tecnica: ChefHat,
  gestao: TrendingUp,
  seguranca: ShieldAlert,
}

const CHAVE_OCULTO = 'coffee-break:dicas-ocultas'

function lerOculto() {
  try {
    return localStorage.getItem(CHAVE_OCULTO) === '1'
  } catch {
    return false
  }
}

// Começa numa dica diferente a cada dia, para a tela não mostrar sempre a mesma.
function indiceDoDia(total: number) {
  const dia = Math.floor(Date.now() / 86_400_000)
  return total ? dia % total : 0
}

// Cartão "Você sabia?" com leis, técnicas e ideias ligadas à tela aberta.
export function VoceSabia({ tela, className }: { tela: Tela; className?: string }) {
  const lista = dicasDaTela(tela)
  const [indice, setIndice] = useState(() => indiceDoDia(lista.length))
  const [oculto, setOculto] = useState(lerOculto)

  if (!lista.length) return null

  if (oculto) {
    return (
      <button
        type="button"
        onClick={() => {
          setOculto(false)
          try {
            localStorage.removeItem(CHAVE_OCULTO)
          } catch {
            /* sem armazenamento: só não lembra */
          }
        }}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground',
          className,
        )}
      >
        <Lightbulb className="size-3.5" />
        Mostrar dicas
      </button>
    )
  }

  const dica = lista[indice % lista.length]
  const Icone = icones[dica.tipo]

  return (
    <aside
      aria-label="Você sabia?"
      className={cn(
        'relative flex gap-3 rounded-2xl border border-amber-300/70 bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 pr-10 shadow-sm dark:border-amber-500/30 dark:from-amber-950/40 dark:to-orange-950/20',
        className,
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
        <Icone className="size-5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[11px] font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-300">
          Você sabia? · {tiposDica[dica.tipo]}
        </p>
        <p className="font-semibold leading-snug">{dica.titulo}</p>
        <p className="text-sm text-foreground/80">{dica.texto}</p>
        {dica.base && <p className="text-xs text-muted-foreground">Base: {dica.base}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm">
          {lista.length > 1 && (
            <button
              type="button"
              onClick={() => setIndice((i) => i + 1)}
              className="inline-flex items-center gap-1 font-medium text-amber-800 hover:underline dark:text-amber-300"
            >
              Outra dica ({(indice % lista.length) + 1}/{lista.length})
              <ChevronRight className="size-3.5" />
            </button>
          )}
          <Link to="/saber" className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            Leis e boas práticas
          </Link>
        </div>
      </div>
      <button
        type="button"
        aria-label="Ocultar dicas"
        title="Ocultar dicas"
        onClick={() => {
          setOculto(true)
          try {
            localStorage.setItem(CHAVE_OCULTO, '1')
          } catch {
            /* sem armazenamento: só não lembra */
          }
        }}
        className="absolute top-2.5 right-2.5 rounded-md p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </aside>
  )
}
