import '@fontsource/great-vibes/latin-400.css'
import { useMutation } from '@tanstack/react-query'
import { FileSignature, Loader2, LogOut } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogoPao } from '@/components/LogoPao'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/AuthContext'
import textoContrato from '@/features/legal/contrato.txt?raw'
import { api } from '@/lib/api'
import { empresa } from '@/lib/empresa'
import { mensagemErro } from '@/lib/format'

export interface AssinaturaContrato {
  nome_assinado: string
  versao: string
  hash_contrato: string
  assinado_em: string
}

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

// Parágrafos do contrato; títulos (CLÁUSULA, PARTES...) em destaque.
export function TextoContrato() {
  const blocos = useMemo(() => textoContrato.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/), [])
  return (
    <div className="space-y-3 text-[13.5px] leading-relaxed">
      {blocos.map((b, i) => {
        const titulo = i === 0 || /^(CLÁUSULA|PARTES|Versão)/.test(b)
        return titulo ? (
          <p key={i} className={i === 0 ? 'text-center font-heading text-base font-semibold' : 'pt-2 font-semibold'}>
            {b}
          </p>
        ) : (
          <p key={i} className="text-foreground/90">
            {b}
          </p>
        )
      })}
    </div>
  )
}

// Tela cheia: o dono lê o contrato, digita o nome e assina. Depois, a cerimônia: uma caneta
// mágica escreve o nome na linha de assinatura e o carimbo "ASSINADO" cai sobre o papel.
export function CerimoniaContrato({ onConcluir }: { onConcluir: () => void }) {
  const { user, signOut } = useAuth()
  const [leuTudo, setLeuTudo] = useState(false)
  const [nome, setNome] = useState('')
  const [aceite, setAceite] = useState(false)
  const [assinatura, setAssinatura] = useState<AssinaturaContrato | null>(null)
  const rolagem = useRef<HTMLDivElement>(null)

  const nomeConfere = Boolean(user) && normalizar(nome) === normalizar(user?.nome ?? '')
  const assinar = useMutation({
    mutationFn: () => api.post<AssinaturaContrato>('/legal/contrato', { nome: nome.trim(), aceite: true }),
    onSuccess: (a) => setAssinatura(a),
  })

  function conferirRolagem() {
    const el = rolagem.current
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setLeuTudo(true)
  }

  if (assinatura) return <Assinando assinatura={assinatura} onConcluir={onConcluir} />

  return (
    <div className="cerimonia-fundo fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-6">
      <div className="cerimonia-papel-entra flex max-h-[96svh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-amber-200/40 bg-card shadow-2xl">
        <header className="flex items-center gap-3 border-b px-5 py-4 sm:px-7">
          <LogoPao className="size-10" />
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl font-semibold sm:text-2xl">Seu contrato com o Coffee Break</h1>
            <p className="text-sm text-muted-foreground">
              Leia até o fim, digite seu nome e assine. Versão {empresa.versaoTermos}.
            </p>
          </div>
          <FileSignature className="hidden size-7 text-primary sm:block" />
        </header>

        <div
          ref={rolagem}
          onScroll={conferirRolagem}
          className="min-h-48 flex-1 overflow-y-auto bg-[#fffdf8] px-5 py-5 sm:px-8"
          tabIndex={0}
          aria-label="Texto do contrato"
        >
          <TextoContrato />
        </div>

        <footer className="space-y-3 border-t bg-muted/30 px-5 py-4 sm:px-7">
          {!leuTudo && (
            <p className="text-sm font-medium text-amber-800">
              Role o contrato até o fim para liberar a assinatura.
            </p>
          )}
          <fieldset disabled={!leuTudo} className="space-y-3 disabled:opacity-50">
            <div className="space-y-1.5">
              <Label htmlFor="contrato-nome">Seu nome completo, como assinatura</Label>
              <Input
                id="contrato-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={user?.nome}
                autoComplete="name"
                className="font-[Great_Vibes,cursive] text-2xl"
                style={{ fontFamily: "'Great Vibes', cursive" }}
              />
              <p className="text-xs text-muted-foreground">
                Digite exatamente o nome da sua conta: <strong>{user?.nome}</strong>
              </p>
            </div>
            <label htmlFor="contrato-aceite" className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug">
              <input
                id="contrato-aceite"
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
                checked={aceite}
                onChange={(e) => setAceite(e.target.checked)}
              />
              <span>
                Li todo o contrato, os{' '}
                <Link to="/termos" target="_blank" className="font-medium text-primary underline underline-offset-2">
                  Termos de Uso
                </Link>{' '}
                e a{' '}
                <Link to="/privacidade" target="_blank" className="font-medium text-primary underline underline-offset-2">
                  Política de Privacidade
                </Link>
                , entendi o que o Coffee Break entrega e o que não entrega, e assino de forma livre e consciente.
              </span>
            </label>
          </fieldset>
          {assinar.isError && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">
              {mensagemErro(assinar.error, 'Não foi possível assinar agora')}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => signOut()}>
              <LogOut className="size-4" />
              Sair
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={!leuTudo || !aceite || !nomeConfere || assinar.isPending}
              onClick={() => assinar.mutate()}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {assinar.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileSignature className="size-4" />}
              Assinar contrato
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

// A cerimônia: papel, caneta dourada flutuando e escrevendo o nome, carimbo e boas-vindas.
function Assinando({ assinatura, onConcluir }: { assinatura: AssinaturaContrato; onConcluir: () => void }) {
  const primeiroNome = assinatura.nome_assinado.split(' ')[0]
  const quando = new Date(assinatura.assinado_em).toLocaleString('pt-BR')
  return (
    <div className="cerimonia-fundo fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4">
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="cerimonia-faisca"
          style={{ left: `${(i * 53) % 100}%`, animationDelay: `${3.1 + (i % 6) * 0.12}s`, top: `${20 + ((i * 37) % 60)}%` }}
        />
      ))}
      <div className="cerimonia-papel-entra relative w-full max-w-xl rounded-xl bg-[#fffaf0] px-6 pt-8 pb-7 text-[#3b2a1d] shadow-[0_30px_80px_rgba(0,0,0,.55)] sm:px-10">
        <p className="text-center font-heading text-lg font-semibold tracking-wide sm:text-xl">CONTRATO — COFFEE BREAK</p>
        <div aria-hidden className="mt-4 space-y-2 opacity-35">
          {[92, 100, 86, 97, 74].map((w, i) => (
            <div key={i} className="h-1.5 rounded bg-[#3b2a1d]" style={{ width: `${w}%` }} />
          ))}
        </div>

        <div className="relative mt-10">
          <div className="cerimonia-assinatura-caixa relative mx-auto w-fit max-w-full">
            <span
              className="cerimonia-escrita block px-2 text-[44px] leading-[1.15] whitespace-nowrap text-[#1f3a8a] sm:text-[56px]"
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              {assinatura.nome_assinado}
            </span>
            {/* Caneta mágica: dourada, brilhando, acompanha a ponta da escrita. */}
            <span aria-hidden className="cerimonia-caneta">
              <svg viewBox="0 0 64 64" className="size-16 sm:size-20">
                <defs>
                  <linearGradient id="ouro" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="#fff3c4" />
                    <stop offset=".45" stopColor="#f2c14e" />
                    <stop offset="1" stopColor="#9a6a12" />
                  </linearGradient>
                </defs>
                <path d="M46 4 L60 18 L24 54 L10 40 Z" fill="url(#ouro)" stroke="#7a520e" strokeWidth="1.5" />
                <path d="M10 40 L24 54 L6 60 Z" fill="#2b1a0c" />
                <path d="M6 60 L9 52" stroke="#fff3c4" strokeWidth="1.2" />
                <path d="M40 10 L54 24" stroke="#fff8dc" strokeWidth="2" opacity=".7" />
              </svg>
            </span>
          </div>
          <div className="mx-auto h-px w-11/12 bg-[#3b2a1d]/60" />
          <p className="mt-1.5 text-center text-xs tracking-wide text-[#3b2a1d]/70">ASSINATURA DO CONTRATANTE</p>
        </div>

        <div aria-hidden className="cerimonia-carimbo absolute top-6 right-4 rounded-lg border-4 border-emerald-700 px-3 py-1.5 text-center font-heading text-lg font-bold tracking-widest text-emerald-700 sm:right-8 sm:text-2xl">
          ASSINADO
          <span className="block text-[10px] font-semibold tracking-normal">{quando}</span>
        </div>

        <div className="cerimonia-final mt-7 space-y-3 text-center">
          <p className="font-heading text-2xl font-semibold">Bem-vindo ao time, {primeiroNome}!</p>
          <p className="text-xs break-all text-[#3b2a1d]/70">
            Contrato versão {assinatura.versao} · assinado em {quando} · código de integridade{' '}
            {assinatura.hash_contrato.slice(0, 16)}…
          </p>
          <Button type="button" size="lg" onClick={onConcluir} className="bg-amber-600 text-white hover:bg-amber-700">
            Começar a usar o Coffee Break
          </Button>
        </div>
      </div>
    </div>
  )
}
