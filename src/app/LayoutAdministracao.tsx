import { Activity, Loader2, LogOut, Megaphone, ShieldCheck, Store, Users } from 'lucide-react'
import { Suspense, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { LogoPao } from '@/components/LogoPao'
import { useAuth } from '@/features/auth/AuthContext'
import { PerfilDialog } from '@/features/auth/PerfilDialog'
import { usePendentesPlataforma } from '@/features/plataforma/usePendentes'
import { cn } from '@/lib/utils'

const ITENS = [
  { to: '/plataforma', label: 'Visão geral', icon: ShieldCheck, end: true },
  { to: '/plataforma/padarias', label: 'Padarias', icon: Store },
  { to: '/plataforma/pessoas', label: 'Pessoas', icon: Users },
  { to: '/plataforma/atividade', label: 'Atividade', icon: Activity },
  { to: '/plataforma/comunicados', label: 'Comunicados', icon: Megaphone },
]

// Conta só de administração (sem padaria): um sistema à parte, que é a central de comando do
// Coffee Break. Nenhuma tela de padaria aparece aqui.
export function LayoutAdministracao() {
  const { user, signOut } = useAuth()
  const { pathname } = useLocation()
  const [perfilAberto, setPerfilAberto] = useState(false)
  const pendentes = usePendentesPlataforma(true)

  if (!pathname.startsWith('/plataforma')) return <Navigate to="/plataforma" replace />

  const navegacao = (compacta: boolean) =>
    ITENS.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-2.5 rounded-xl text-sm font-medium transition-[background-color,color,box-shadow,scale] duration-200 ease-(--ease-out)',
            compacta ? 'shrink-0 px-3 py-2' : 'px-3 py-2.5',
            isActive
              ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-[#2a170c] shadow-[0_8px_24px_-8px_rgba(251,191,36,.6)]'
              : 'text-[#fff6e8]/70 hover:bg-white/[0.07] hover:text-[#fff6e8]',
          )
        }
      >
        <item.icon className="size-4 transition-transform duration-300 group-hover:scale-110" />
        {item.label}
        {item.to === '/plataforma/padarias' && pendentes > 0 && (
          <span
            className="adm-pulso ml-auto rounded-full bg-amber-400 px-1.5 text-[11px] leading-5 font-bold text-[#2a170c]"
            title={`${pendentes} padaria(s) esperando liberação`}
          >
            {pendentes}
          </span>
        )}
      </NavLink>
    ))

  return (
    <div className="flex h-svh flex-col bg-background md:flex-row">
      {/* Celular: barra no topo com as seções roláveis */}
      <header className="adm-fundo relative shrink-0 text-[#fff6e8] md:hidden">
        <div className="flex items-center gap-3 px-4 pt-3">
          <LogoPao className="size-8" />
          <p className="flex-1 font-heading text-lg font-semibold">
            Coffee Break <span className="text-sm font-normal text-amber-300">Administração</span>
          </p>
          <button type="button" aria-label="Sair" onClick={() => void signOut()} className="rounded-lg p-2 hover:bg-white/10">
            <LogOut className="size-5" />
          </button>
        </div>
        <nav aria-label="Administração" className="flex gap-1.5 overflow-x-auto px-3 py-3">
          {navegacao(true)}
        </nav>
      </header>

      {/* Computador: barra lateral */}
      <aside className="adm-fundo relative hidden w-64 shrink-0 flex-col text-[#fff6e8] md:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <LogoPao className="size-10" />
          <div className="min-w-0">
            <p className="font-heading text-lg leading-tight font-semibold">Coffee Break</p>
            <p className="text-xs font-semibold text-amber-300">Central de administração</p>
          </div>
        </div>
        <nav aria-label="Administração" className="flex-1 space-y-1 p-3">
          {navegacao(false)}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => setPerfilAberto(true)}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[0.07]"
          >
            {user && <Avatar nome={user.nome} foto={user.foto} className="size-9" />}
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{user?.nome}</span>
              <span className="block truncate text-xs text-[#fff6e8]/60">Administrador · Editar perfil</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[#fff6e8]/70 transition-colors hover:bg-white/[0.07] hover:text-[#fff6e8]"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-auto p-4 md:p-8">
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <div key={pathname} className="tela-entra mx-auto max-w-7xl">
            <Outlet />
          </div>
        </Suspense>
        <PerfilDialog open={perfilAberto} onOpenChange={setPerfilAberto} />
      </main>
    </div>
  )
}
