// Tipos, rótulos e pecinhas visuais compartilhadas pelas telas da administração.
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type Status = 'pendente' | 'aprovada' | 'recusada' | 'suspensa'
export type Acao = 'aprovar' | 'recusar' | 'suspender' | 'reativar'

export interface Resumo {
  por_status: Record<Status, number>
  usuarios_ativos: number
  pessoas_hoje: number
  vendas_30_dias: number
  faturamento_30_dias: number
  padarias_vendendo_hoje: number
  novas_7_dias: number
  novas_30_dias: number
  alertas_24h: number
  serie: { dia: string; cadastros: number; vendas: number; faturamento: number }[]
  fila: { id: string; status: Status; created_at: string; nome_fantasia: string | null; documentos: number }[]
}

export interface PadariaLinha {
  id: string
  status: Status
  status_motivo: string | null
  created_at: string
  nome_fantasia: string | null
  razao_social: string | null
  cnpj: string | null
  cidade: string | null
  uf: string | null
  dono_nome: string | null
  dono_email: string | null
  pessoas: number
  documentos: number
  contrato_assinado: boolean
  ultimo_acesso: string | null
  vendas_30_dias: number
}

export const ROTULO_STATUS: Record<Status, string> = {
  pendente: 'Em análise',
  aprovada: 'Liberada',
  recusada: 'Recusada',
  suspensa: 'Suspensa',
}

export const COR_STATUS: Record<Status, string> = {
  pendente: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  aprovada: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  recusada: 'bg-destructive/10 text-destructive',
  suspensa: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
}

export const ROTULO_ACAO: Record<string, string> = {
  aprovar: 'Liberou a padaria',
  recusar: 'Recusou o cadastro',
  suspender: 'Suspendeu o acesso',
  reativar: 'Reativou o acesso',
  bloquear_pessoa: 'Bloqueou o acesso de uma pessoa',
  reativar_pessoa: 'Liberou o acesso de uma pessoa',
  encerrar_sessoes: 'Encerrou sessões',
  publicar_comunicado: 'Publicou um comunicado',
  encerrar_comunicado: 'Encerrou um comunicado',
  republicar_comunicado: 'Republicou um comunicado',
}

export const ROTULO_EVENTO: Record<string, string> = {
  login: 'Entrou',
  login_falhou: 'Senha errada',
  conta_bloqueada: 'Conta bloqueada por tentativas',
  codigo_enviado: 'Pediu código de senha',
  entrou_com_codigo: 'Entrou com código',
  senha_alterada: 'Trocou a senha',
  saiu_de_todos: 'Saiu de todos os aparelhos',
}

export const ROTULO_PAPEL: Record<string, string> = { dono: 'Dono', admin: 'Gerente', funcionario: 'Funcionário' }

export const data = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—')
export const dataHora = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

export function SeloStatus({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn('inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', COR_STATUS[status], className)}>
      {ROTULO_STATUS[status]}
    </span>
  )
}

export function Cartao({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-2xl border bg-card p-5 shadow-sm', className)}>{children}</section>
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-muted-foreground">{children}</p>
}

// Download de arquivos da administração (CSV, documentos) com o cookie da sessão.
export async function baixar(url: string, nome: string) {
  const r = await fetch(url, { credentials: 'include' })
  if (!r.ok) throw new Error('Não deu para baixar o arquivo')
  const link = URL.createObjectURL(await r.blob())
  const a = document.createElement('a')
  a.href = link
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(link), 10_000)
}
