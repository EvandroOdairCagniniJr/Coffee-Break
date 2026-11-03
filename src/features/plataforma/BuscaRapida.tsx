import { useQuery } from '@tanstack/react-query'
import { Loader2, Search, Store, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { mascaraCNPJ } from '@/lib/documentos'
import { cn } from '@/lib/utils'
import { ROTULO_PAPEL, SeloStatus, type Status } from '@/features/plataforma/comum'

interface Resultado {
  padarias: { id: string; status: Status; nome: string | null; cnpj: string | null }[]
  pessoas: { id: string; nome: string; email: string; papel: string; padaria_id: string | null; padaria: string | null }[]
}

// Ctrl+K (ou Cmd+K): acha qualquer padaria ou pessoa da plataforma e abre a ficha.
export function BuscaRapida({
  aberta,
  aoMudar,
  abrirPadaria,
}: {
  aberta: boolean
  aoMudar: (v: boolean) => void
  abrirPadaria: (id: string) => void
}) {
  const [termo, setTermo] = useState('')
  const [indice, setIndice] = useState(0)
  const [atraso, setAtraso] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setAtraso(termo.trim()), 200)
    return () => clearTimeout(id)
  }, [termo])

  const busca = useQuery({
    queryKey: ['plataforma', 'busca', atraso],
    queryFn: () => api.get<Resultado>(`/plataforma/busca?q=${encodeURIComponent(atraso)}`),
    enabled: aberta && atraso.length >= 2,
    staleTime: 30_000,
  })

  // Uma lista só, para as setas do teclado.
  const itens = [
    ...(busca.data?.padarias ?? []).map((p) => ({ chave: `p-${p.id}`, padariaId: p.id, tipo: 'padaria' as const, p })),
    ...(busca.data?.pessoas ?? [])
      .filter((p) => p.padaria_id)
      .map((p) => ({ chave: `u-${p.id}`, padariaId: p.padaria_id as string, tipo: 'pessoa' as const, p })),
  ]

  const escolher = (padariaId: string) => {
    aoMudar(false)
    setTermo('')
    abrirPadaria(padariaId)
  }

  return (
    <Dialog
      open={aberta}
      onOpenChange={(v) => {
        aoMudar(v)
        if (!v) setTermo('')
      }}
    >
      <DialogContent className="top-[18%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="sr-only">Buscar padaria ou pessoa</DialogTitle>
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value)
              setIndice(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setIndice((i) => Math.min(i + 1, Math.max(itens.length - 1, 0)))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setIndice((i) => Math.max(i - 1, 0))
              } else if (e.key === 'Enter' && itens[indice]) {
                e.preventDefault()
                escolher(itens[indice].padariaId)
              }
            }}
            placeholder="Padaria, CNPJ, pessoa ou e-mail"
            aria-label="Buscar padaria ou pessoa"
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none"
          />
          {busca.isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          <kbd className="hidden rounded border bg-muted px-1.5 text-[11px] text-muted-foreground sm:block">Esc</kbd>
        </div>
        <div className="max-h-[50svh] overflow-y-auto p-2" role="listbox" aria-label="Resultados">
          {atraso.length < 2 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Digite pelo menos 2 letras.</p>
          ) : !busca.isFetching && itens.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nada encontrado para "{atraso}".</p>
          ) : (
            itens.map((item, i) => (
              <button
                key={item.chave}
                type="button"
                role="option"
                aria-selected={i === indice}
                onMouseEnter={() => setIndice(i)}
                onClick={() => escolher(item.padariaId)}
                className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm', i === indice && 'bg-muted')}
              >
                {item.tipo === 'padaria' ? (
                  <>
                    <Store className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.p.nome ?? 'Sem nome'}</span>
                      <span className="block text-xs text-muted-foreground">{item.p.cnpj ? mascaraCNPJ(item.p.cnpj) : 'Padaria'}</span>
                    </span>
                    <SeloStatus status={item.p.status} />
                  </>
                ) : (
                  <>
                    <User className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.p.nome}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.p.email} · {ROTULO_PAPEL[item.p.papel] ?? item.p.papel} em {item.p.padaria ?? '—'}
                      </span>
                    </span>
                  </>
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
