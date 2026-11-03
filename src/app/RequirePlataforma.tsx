import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'

// Administração da plataforma: para todo o resto, a rota simplesmente não leva a lugar nenhum.
export function RequirePlataforma() {
  const { user } = useAuth()
  if (!user?.plataforma) return <Navigate to="/pdv" replace />
  return <Outlet />
}
