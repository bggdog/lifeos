import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'lifeos.activeUser'

export type LifeOsUser = 'Branson' | 'Kelsee'

type UserContextValue = {
  activeUser: LifeOsUser | null
  setActiveUser: (user: LifeOsUser | null) => void
  logout: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

function readStoredUser(): LifeOsUser | null {
  const raw = globalThis.sessionStorage.getItem(STORAGE_KEY)
  if (raw === 'Branson' || raw === 'Kelsee') return raw
  return null
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUserState] = useState<LifeOsUser | null>(() =>
    readStoredUser(),
  )

  useEffect(() => {
    try {
      globalThis.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const setActiveUser = useCallback((user: LifeOsUser | null) => {
    if (user) globalThis.sessionStorage.setItem(STORAGE_KEY, user)
    else globalThis.sessionStorage.removeItem(STORAGE_KEY)
    setActiveUserState(readStoredUser())
  }, [])

  const logout = useCallback(() => {
    globalThis.sessionStorage.removeItem(STORAGE_KEY)
    setActiveUserState(null)
  }, [])

  const value = useMemo(
    () => ({ activeUser, setActiveUser, logout }),
    [activeUser, setActiveUser, logout],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
