import { Toast } from '@heroui/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HeartCheckInProvider } from './context/HeartCheckInContext'
import { UserProvider } from './context/UserContext'
import { HeroUIProvider } from './providers/hero-ui-provider'
import { AriaRouterProvider } from './providers/aria-router-provider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AriaRouterProvider>
        <UserProvider>
          <HeartCheckInProvider>
            <HeroUIProvider>
              <>
                <App />
                {/* ToastRegion mounts nothing when the queue is empty; keep App outside. */}
                <Toast.Provider placement="bottom" />
              </>
            </HeroUIProvider>
          </HeartCheckInProvider>
        </UserProvider>
      </AriaRouterProvider>
    </BrowserRouter>
  </StrictMode>,
)
