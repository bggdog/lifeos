import { Toast } from '@heroui/react'
import { StrictMode, useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { HeartCheckInProvider } from './context/HeartCheckInContext'
import { UserProvider } from './context/UserContext'
import { hydrateLifeOsStorage } from './lib/storage'
import { HeroUIProvider } from './providers/hero-ui-provider'
import { AriaRouterProvider } from './providers/aria-router-provider'
import App from './App.tsx'
import { refreshWarrantyFromStorage } from './warranty/WarrantyContext'

export function BootRoot() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void hydrateLifeOsStorage()
      .then(() => {
        refreshWarrantyFromStorage()
        setReady(true)
      })
      .catch((e: unknown) => {
        console.error(e)
        setError(
          e instanceof Error ? e.message : 'Failed to load LifeOS data.',
        )
      })
  }, [])

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background px-6 text-center text-foreground">
        <p className="text-lg font-semibold">Couldn&apos;t load LifeOS</p>
        <p className="text-sm opacity-70">{error}</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-foreground/55">
        Loading…
      </div>
    )
  }

  return (
    <StrictMode>
      <BrowserRouter>
        <AriaRouterProvider>
          <UserProvider>
            <HeartCheckInProvider>
              <HeroUIProvider>
                <>
                  <App />
                  <Toast.Provider placement="top" />
                </>
              </HeroUIProvider>
            </HeartCheckInProvider>
          </UserProvider>
        </AriaRouterProvider>
      </BrowserRouter>
    </StrictMode>
  )
}
