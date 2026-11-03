import { Link } from 'react-router-dom'

// Caixa obrigatória ao criar conta: o aceite fica registrado no servidor (data e versão).
export function AceiteTermos({
  id,
  marcado,
  onChange,
}: {
  id: string
  marcado: boolean
  onChange: (marcado: boolean) => void
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-primary"
        checked={marcado}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        Li e aceito os{' '}
        <Link to="/termos" target="_blank" className="font-medium text-primary underline underline-offset-2">
          Termos de Uso
        </Link>{' '}
        e a{' '}
        <Link to="/privacidade" target="_blank" className="font-medium text-primary underline underline-offset-2">
          Política de Privacidade
        </Link>
        .
      </span>
    </label>
  )
}

export const AVISO_ACEITE = 'Para criar a conta, marque que leu e aceita os Termos de Uso e a Política de Privacidade.'
