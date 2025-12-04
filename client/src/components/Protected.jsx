import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Protected() {
  const { token, loading } = useAuth()
  if (loading) return <div style={{ padding: 16 }}>Loading...</div>
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

