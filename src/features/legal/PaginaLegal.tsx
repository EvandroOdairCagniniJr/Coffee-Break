import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LogoPao } from '@/components/LogoPao'
import { empresa } from '@/lib/empresa'

// Moldura das páginas públicas de Termos de Uso e Política de Privacidade.
export function PaginaLegal({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="fundo-padaria min-h-svh px-4 py-8">
      <article className="mx-auto max-w-3xl space-y-6 rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
        <header className="space-y-3 border-b pb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <LogoPao className="size-10" />
            <div>
              <h1 className="font-heading text-3xl font-semibold tracking-tight">{titulo}</h1>
              <p className="text-sm text-muted-foreground">
                {empresa.produto} · vigente desde {empresa.vigenciaTermos} · versão {empresa.versaoTermos}
              </p>
            </div>
          </div>
        </header>
        <div className="legal-texto space-y-6 text-[15px] leading-relaxed">{children}</div>
        <footer className="space-y-1 border-t pt-6 text-sm text-muted-foreground">
          <p>
            {empresa.produto} é oferecido por {empresa.responsavel}, {empresa.tipo}, CNPJ {empresa.cnpj}.
          </p>
          <p>
            Contato e privacidade: <span className="font-medium text-foreground select-all">{empresa.email}</span>
          </p>
          <p className="flex gap-3 pt-2">
            <Link to="/termos" className="underline underline-offset-2 hover:text-foreground">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="underline underline-offset-2 hover:text-foreground">
              Política de Privacidade
            </Link>
          </p>
        </footer>
      </article>
    </div>
  )
}

export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-heading text-xl font-semibold">{titulo}</h2>
      <div className="space-y-2 text-foreground/90 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">{children}</div>
    </section>
  )
}

// Rodapé com os links legais (login, cadastro e perfil).
export function LinksLegais({ className }: { className?: string }) {
  return (
    <p className={className ?? 'text-center text-xs text-muted-foreground'}>
      <Link to="/termos" target="_blank" className="underline underline-offset-2 hover:text-foreground">
        Termos de Uso
      </Link>
      {' · '}
      <Link to="/privacidade" target="_blank" className="underline underline-offset-2 hover:text-foreground">
        Política de Privacidade
      </Link>
    </p>
  )
}
