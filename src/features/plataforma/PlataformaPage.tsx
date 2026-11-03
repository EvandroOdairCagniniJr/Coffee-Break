import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AtividadeSecao } from '@/features/plataforma/AtividadeSecao'
import { BuscaRapida } from '@/features/plataforma/BuscaRapida'
import { ComunicadosSecao } from '@/features/plataforma/ComunicadosSecao'
import { DetalhePadaria } from '@/features/plataforma/DetalhePadaria'
import { PadariasSecao } from '@/features/plataforma/PadariasSecao'
import { PessoasSecao } from '@/features/plataforma/PessoasSecao'
import { VisaoGeral } from '@/features/plataforma/VisaoGeral'

const SECOES = {
  '': { titulo: 'Visão geral', sub: 'O que espera por você e como a plataforma está indo' },
  padarias: { titulo: 'Padarias', sub: 'Liberação, cadastro completo, documentos e decisões' },
  pessoas: { titulo: 'Pessoas', sub: 'Todos os usuários de todas as padarias' },
  atividade: { titulo: 'Atividade', sub: 'Entradas, tentativas suspeitas e o histórico das suas decisões' },
  comunicados: { titulo: 'Comunicados', sub: 'Avisos que aparecem no topo do sistema das padarias' },
} as const

type Secao = keyof typeof SECOES

// Administração do Coffee Break: só existe para o administrador da plataforma.
export function PlataformaPage() {
  const params = useParams()
  const primeira = (params['*'] ?? '').split('/')[0]
  const secao = (primeira in SECOES ? primeira : '') as Secao
  const [busca, setBusca] = useState(false)
  // A ficha da padaria fica no endereço (?padaria=id): dá para abrir de qualquer seção e voltar.
  const [query, setQuery] = useSearchParams()
  const padariaAberta = query.get('padaria')
  const abrirPadaria = (id: string) =>
    setQuery((q) => {
      q.set('padaria', id)
      return q
    })
  const fecharPadaria = () =>
    setQuery((q) => {
      q.delete('padaria')
      return q
    })

  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setBusca(true)
      }
    }
    window.addEventListener('keydown', atalho)
    return () => window.removeEventListener('keydown', atalho)
  }, [])

  const { titulo, sub } = SECOES[secao]
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Administração do Coffee Break</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">{titulo}</h1>
          <p className="text-sm text-muted-foreground">{sub}</p>
        </div>
        <button
          type="button"
          onClick={() => setBusca(true)}
          className="flex w-full items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/50 sm:w-72"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Buscar padaria ou pessoa</span>
          <kbd className="hidden rounded border bg-muted px-1.5 text-[11px] sm:inline">Ctrl K</kbd>
        </button>
      </div>

      {secao === '' && <VisaoGeral abrirPadaria={abrirPadaria} />}
      {secao === 'padarias' && <PadariasSecao abrirPadaria={abrirPadaria} />}
      {secao === 'pessoas' && <PessoasSecao abrirPadaria={abrirPadaria} />}
      {secao === 'atividade' && <AtividadeSecao abrirPadaria={abrirPadaria} />}
      {secao === 'comunicados' && <ComunicadosSecao />}

      <DetalhePadaria id={padariaAberta} aoFechar={fecharPadaria} />
      <BuscaRapida aberta={busca} aoMudar={setBusca} abrirPadaria={abrirPadaria} />
    </div>
  )
}
