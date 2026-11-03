import { useQuery } from '@tanstack/react-query'
import { Info, Megaphone, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Comunicado {
  id: string
  titulo: string
  texto: string
  tom: 'info' | 'aviso' | 'novidade'
  created_at: string
}

const CHAVE = 'coffee-break:comunicados-fechados'

function lerFechados(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '[]') as string[]
  } catch {
    return []
  }
}

const estilo = {
  info: { icone: Info, classe: 'border-sky-300/70 bg-sky-50 text-sky-950 dark:bg-sky-950/30 dark:text-sky-100' },
  aviso: { icone: Megaphone, classe: 'border-amber-300/80 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100' },
  novidade: { icone: Sparkles, classe: 'border-emerald-300/70 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100' },
}

// Comunicados da administração do Coffee Break, no topo de todas as telas. Cada pessoa fecha
// os que já leu (fica guardado só neste aparelho).
export function FaixaComunicados() {
  const [fechados, setFechados] = useState(lerFechados)
  const comunicados = useQuery({
    queryKey: ['comunicados'],
    queryFn: () => api.get<Comunicado[]>('/comunicados'),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  })
  const visiveis = (comunicados.data ?? []).filter((c) => !fechados.includes(c.id))
  if (!visiveis.length) return null

  const fechar = (id: string) => {
    const novos = [...fechados, id].slice(-50)
    setFechados(novos)
    try {
      localStorage.setItem(CHAVE, JSON.stringify(novos))
    } catch {
      /* sem armazenamento: volta a aparecer ao recarregar */
    }
  }

  return (
    <div className="mb-4 space-y-2" role="region" aria-label="Comunicados do Coffee Break">
      {visiveis.map((c) => {
        const { icone: Icone, classe } = estilo[c.tom] ?? estilo.info
        return (
          <div key={c.id} className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm', classe)}>
            <Icone className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{c.titulo}</p>
              <p className="whitespace-pre-line opacity-90">{c.texto}</p>
            </div>
            <button
              type="button"
              aria-label={`Fechar o comunicado ${c.titulo}`}
              onClick={() => fechar(c.id)}
              className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
