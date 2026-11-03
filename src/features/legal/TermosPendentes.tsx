import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/features/auth/AuthContext'
import { AceiteTermos } from '@/features/legal/AceiteTermos'
import { api } from '@/lib/api'
import { mensagemErro } from '@/lib/format'

interface SituacaoTermos {
  versao_atual: string
  versao_aceita: string | null
  aceito_em: string | null
  pendente: boolean
}

// Quem ainda não aceitou a versão atual dos Termos e da Política vê esta janela antes de tudo
// (inclusive antes do vídeo de boas-vindas). Sem aceite, a pessoa pode só sair.
export function PortaoTermos({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const queryClient = useQueryClient()
  const [aceite, setAceite] = useState(false)
  const situacao = useQuery({
    queryKey: ['legal', 'termos'],
    queryFn: () => api.get<SituacaoTermos>('/legal/termos'),
    staleTime: Infinity,
    refetchInterval: false,
  })
  const aceitar = useMutation({
    mutationFn: () => api.post('/legal/termos', { aceite: true }),
    onSuccess: () => queryClient.setQueryData(['legal', 'termos'], { ...situacao.data, pendente: false }),
    onError: (err) => toast.error(mensagemErro(err, 'Não foi possível registrar o aceite')),
  })

  if (!situacao.data) return null
  if (!situacao.data.pendente) return <>{children}</>

  const atualizacao = situacao.data.versao_aceita !== null
  return (
    <Dialog open>
      <DialogContent className="sm:max-w-lg" showCloseButton={false} onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            {atualizacao ? 'Atualizamos nossos termos' : 'Termos de Uso e Privacidade'}
          </DialogTitle>
          <DialogDescription>
            {atualizacao
              ? 'Os Termos de Uso e a Política de Privacidade mudaram. Leia e aceite para continuar usando o Coffee Break.'
              : 'Para continuar, leia e aceite os Termos de Uso e a Política de Privacidade do Coffee Break. Eles explicam as regras do sistema e como cuidamos dos seus dados, conforme a LGPD.'}
          </DialogDescription>
        </DialogHeader>
        <AceiteTermos id="aceite-pendente" marcado={aceite} onChange={setAceite} />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => signOut()}>
            Sair
          </Button>
          <Button type="button" disabled={!aceite || aceitar.isPending} onClick={() => aceitar.mutate()}>
            {aceitar.isPending && <Loader2 className="size-4 animate-spin" />}
            Aceitar e continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
