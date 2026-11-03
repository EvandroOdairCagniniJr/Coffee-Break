import { TextoContrato } from '@/features/legal/CerimoniaContrato'
import { PaginaLegal } from '@/features/legal/PaginaLegal'

// Leitura pública do contrato (antes de criar a conta, ou para consultar depois).
export function ContratoPage() {
  return (
    <PaginaLegal titulo="Contrato de licença de uso">
      <p className="rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900">
        O dono da padaria assina este contrato eletronicamente no primeiro acesso, digitando o nome
        completo. Ficam registrados a data e a hora, o IP, o navegador, a versão e o código de
        integridade do texto assinado.
      </p>
      <TextoContrato />
    </PaginaLegal>
  )
}
