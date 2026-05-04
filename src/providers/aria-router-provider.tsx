import { RouterProvider as RACRouterProvider } from '@heroui/react'
import { useHref, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export function AriaRouterProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <RACRouterProvider navigate={navigate} useHref={useHref}>
      {children}
    </RACRouterProvider>
  )
}
