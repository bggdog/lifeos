import { Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export function RootRedirect() {
  const { activeUser } = useUser()
  return <Navigate to={activeUser ? '/dashboard' : '/login'} replace />
}
