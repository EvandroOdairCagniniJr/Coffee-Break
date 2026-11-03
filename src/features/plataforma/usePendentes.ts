import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Contador do menu: quantas padarias esperam liberação. Só pergunta ao servidor para quem
// administra a plataforma (para o resto, a consulta nem existe).
export function usePendentesPlataforma(ativo: boolean) {
  const resumo = useQuery({
    queryKey: ['plataforma', 'resumo'],
    queryFn: () => api.get<{ por_status: { pendente: number } }>('/plataforma/resumo'),
    enabled: ativo,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
  return resumo.data?.por_status.pendente ?? 0
}
