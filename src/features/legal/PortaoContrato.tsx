import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { CerimoniaContrato, type AssinaturaContrato } from '@/features/legal/CerimoniaContrato'
import { api } from '@/lib/api'

interface SituacaoContrato {
  versao: string
  hash: string
  pendente: boolean
  assinatura: AssinaturaContrato | null
}

// O dono que ainda não assinou a versão atual do contrato vê a assinatura antes de tudo
// (logo depois de criar a conta, ou no próximo acesso quando o contrato muda).
export function PortaoContrato({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const situacao = useQuery({
    queryKey: ['legal', 'contrato'],
    queryFn: () => api.get<SituacaoContrato>('/legal/contrato'),
    staleTime: Infinity,
    refetchInterval: false,
  })
  if (!situacao.data) return null
  if (!situacao.data.pendente) return <>{children}</>
  return (
    <CerimoniaContrato
      onConcluir={() => {
        queryClient.setQueryData(['legal', 'contrato'], { ...situacao.data, pendente: false })
        // Assinar o contrato também registra o aceite dos Termos e da Política.
        void queryClient.invalidateQueries({ queryKey: ['legal', 'termos'] })
      }}
    />
  )
}
