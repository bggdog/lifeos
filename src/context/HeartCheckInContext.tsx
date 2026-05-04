import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getSharedData, setSharedData, subscribeKv } from '../lib/storage'
import type { LifeOsUser } from './UserContext'
import { useUser } from './UserContext'

const HEART_KEY = 'heartcheckins'

export type HeartCheckInEntry = {
  id: string
  user: LifeOsUser
  text: string
  date: string
  /** ISO 8601 string */
  timestamp: string
  seenBy: LifeOsUser[]
}

function partnerOf(user: LifeOsUser): LifeOsUser {
  return user === 'Branson' ? 'Kelsee' : 'Branson'
}

function parseTimestamp(raw: unknown): string | null {
  if (typeof raw === 'string' && raw.length >= 10) {
    const t = Date.parse(raw)
    if (!Number.isNaN(t)) return new Date(t).toISOString()
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return new Date(raw).toISOString()
  }
  return null
}

function normalizeEntry(x: unknown): HeartCheckInEntry | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  if (
    typeof o.id !== 'string' ||
    (o.user !== 'Branson' && o.user !== 'Kelsee') ||
    typeof o.text !== 'string' ||
    typeof o.date !== 'string'
  ) {
    return null
  }
  const ts = parseTimestamp(o.timestamp)
  if (!ts) return null
  const seenRaw = o.seenBy
  const seenBy = Array.isArray(seenRaw)
    ? seenRaw.filter((u): u is LifeOsUser => u === 'Branson' || u === 'Kelsee')
    : []
  return {
    id: o.id,
    user: o.user,
    text: o.text,
    date: o.date,
    timestamp: ts,
    seenBy,
  }
}

function readEntries(): HeartCheckInEntry[] {
  const data = getSharedData(HEART_KEY)
  if (!Array.isArray(data)) return []
  const out: HeartCheckInEntry[] = []
  for (const item of data) {
    const n = normalizeEntry(item)
    if (n) out.push(n)
  }
  return out.sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  )
}

function writeEntries(entries: HeartCheckInEntry[]): void {
  setSharedData(HEART_KEY, entries)
}

export function todayLocalISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Full greeting line with emoji (time-aware). */
export function greetingForUser(user: LifeOsUser): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return `Good morning, ${user} 👋`
  if (h >= 12 && h < 17) return `Good afternoon, ${user} ☀️`
  if (h >= 17 && h < 21) return `Good evening, ${user} 🌇`
  return `Hey, ${user} 🌙`
}

type HeartCheckInContextValue = {
  entries: HeartCheckInEntry[]
  hasCheckedInToday: (user: LifeOsUser) => boolean
  submitCheckIn: (text: string) => void
  getCheckIns: () => HeartCheckInEntry[]
  getPartnerCheckIns: () => HeartCheckInEntry[]
  getLatestPartnerCheckIn: () => HeartCheckInEntry | null
  unreadPartnerCount: number
  markAllSeen: () => void
}

const HeartCheckInContext = createContext<HeartCheckInContextValue | null>(
  null,
)

export function HeartCheckInProvider({ children }: { children: ReactNode }) {
  const { activeUser } = useUser()
  const [entries, setEntries] = useState<HeartCheckInEntry[]>(() =>
    readEntries(),
  )

  useEffect(() => subscribeKv(() => setEntries(readEntries())), [])

  const hasCheckedInToday = useCallback(
    (user: LifeOsUser) => {
      const today = todayLocalISO()
      return entries.some((e) => e.user === user && e.date === today)
    },
    [entries],
  )

  const submitCheckIn = useCallback(
    (text: string) => {
      if (!activeUser) return
      const trimmed = text.trim()
      if (!trimmed) return
      const next: HeartCheckInEntry = {
        id: crypto.randomUUID(),
        user: activeUser,
        text: trimmed,
        date: todayLocalISO(),
        timestamp: new Date().toISOString(),
        seenBy: [],
      }
      setEntries((prev) => {
        const merged = [next, ...prev].sort(
          (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
        )
        writeEntries(merged)
        return merged
      })
    },
    [activeUser],
  )

  const getCheckIns = useCallback(() => [...entries], [entries])

  const getPartnerCheckIns = useCallback(() => {
    if (!activeUser) return []
    const p = partnerOf(activeUser)
    return entries
      .filter((e) => e.user === p)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
  }, [activeUser, entries])

  const getLatestPartnerCheckIn = useCallback((): HeartCheckInEntry | null => {
    const list = getPartnerCheckIns()
    return list[0] ?? null
  }, [getPartnerCheckIns])

  const unreadPartnerCount = useMemo(() => {
    if (!activeUser) return 0
    const p = partnerOf(activeUser)
    return entries.filter(
      (e) => e.user === p && !e.seenBy.includes(activeUser),
    ).length
  }, [activeUser, entries])

  const markAllSeen = useCallback(() => {
    if (!activeUser) return
    setEntries((prev) => {
      const next = prev.map((e) => {
        if (e.user === activeUser) return e
        if (e.seenBy.includes(activeUser)) return e
        return { ...e, seenBy: [...e.seenBy, activeUser] }
      })
      writeEntries(next)
      return next
    })
  }, [activeUser])

  const value = useMemo(
    () => ({
      entries,
      hasCheckedInToday,
      submitCheckIn,
      getCheckIns,
      getPartnerCheckIns,
      getLatestPartnerCheckIn,
      unreadPartnerCount,
      markAllSeen,
    }),
    [
      entries,
      hasCheckedInToday,
      submitCheckIn,
      getCheckIns,
      getPartnerCheckIns,
      getLatestPartnerCheckIn,
      unreadPartnerCount,
      markAllSeen,
    ],
  )

  return (
    <HeartCheckInContext.Provider value={value}>
      {children}
    </HeartCheckInContext.Provider>
  )
}

export function useHeartCheckIn(): HeartCheckInContextValue {
  const ctx = useContext(HeartCheckInContext)
  if (!ctx) {
    throw new Error('useHeartCheckIn must be used within HeartCheckInProvider')
  }
  return ctx
}
