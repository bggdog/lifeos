import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export function RequireAuth() {
  const { activeUser } = useUser()
  const location = useLocation()

  if (!activeUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
