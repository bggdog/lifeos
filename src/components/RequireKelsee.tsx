import { Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { WarrantyProvider } from '../warranty/WarrantyContext'
import { WarrantyLayout } from '../warranty/WarrantyLayout'

/**
 * Kelsee-only warranty suite: redirects others, wraps data + layout (with Outlet).
 */
export function RequireKelsee() {
  const { activeUser } = useUser()

  if (activeUser !== 'Kelsee') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <WarrantyProvider>
      <WarrantyLayout />
    </WarrantyProvider>
  )
}
