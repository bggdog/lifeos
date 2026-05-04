/* eslint-disable react-refresh/only-export-components -- store + Provider + hook */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useSyncExternalStore } from 'react'
import { getUserData, setUserData, subscribeKv } from '../lib/storage'
import { KEYS, WARRANTY_USER } from './constants'
import { DEFAULT_STATUS_CONFIG } from './defaults'
import type {
  Community,
  Contractor,
  Home,
  StatusConfigItem,
  Ticket,
  TicketsViewMode,
} from './types'
import { nowIso, sortStatusConfig } from './utils'

type Snapshot = {
  communities: Community[]
  homes: Home[]
  tickets: Ticket[]
  contractors: Contractor[]
  statusConfig: StatusConfigItem[]
  ticketsView: TicketsViewMode
}

function parseCommunities(raw: unknown): Community[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (x): x is Community =>
      !!x &&
      typeof x === 'object' &&
      typeof (x as Community).id === 'string' &&
      typeof (x as Community).name === 'string',
  )
}

function parseHomes(raw: unknown): Home[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (x): x is Home =>
      !!x &&
      typeof x === 'object' &&
      typeof (x as Home).id === 'string' &&
      typeof (x as Home).communityId === 'string',
  )
}

function parseTickets(raw: unknown): Ticket[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (x): x is Ticket =>
      !!x &&
      typeof x === 'object' &&
      typeof (x as Ticket).id === 'string' &&
      typeof (x as Ticket).homeId === 'string',
  )
}

function parseContractors(raw: unknown): Contractor[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (x): x is Contractor =>
      !!x &&
      typeof x === 'object' &&
      typeof (x as Contractor).id === 'string',
  )
}

function parseStatusConfig(raw: unknown): StatusConfigItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const out: StatusConfigItem[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    if (
      typeof o.id === 'string' &&
      typeof o.label === 'string' &&
      typeof o.color === 'string' &&
      typeof o.order === 'number'
    ) {
      out.push({
        id: o.id,
        label: o.label,
        color: o.color,
        order: o.order,
      })
    }
  }
  return sortStatusConfig(out)
}

function readTicketsView(raw: unknown): TicketsViewMode {
  return raw === 'kanban' ? 'kanban' : 'list'
}

export type WarrantySnapshot = Snapshot

/** Fresh read from localStorage for routes outside WarrantyProvider (e.g. Dashboard). Read-only — does not persist default status config. */
export function loadWarrantySnapshotFromStorage(): WarrantySnapshot {
  let statusConfig = parseStatusConfig(
    getUserData(WARRANTY_USER, KEYS.statusConfig),
  )
  if (statusConfig.length === 0) {
    statusConfig = DEFAULT_STATUS_CONFIG.map((s) => ({ ...s }))
  }

  return {
    communities: parseCommunities(getUserData(WARRANTY_USER, KEYS.communities)),
    homes: parseHomes(getUserData(WARRANTY_USER, KEYS.homes)),
    tickets: parseTickets(getUserData(WARRANTY_USER, KEYS.tickets)),
    contractors: parseContractors(getUserData(WARRANTY_USER, KEYS.contractors)),
    statusConfig,
    ticketsView: readTicketsView(getUserData(WARRANTY_USER, KEYS.ticketsView)),
  }
}

function readSnapshot(): Snapshot {
  let statusConfig = parseStatusConfig(
    getUserData(WARRANTY_USER, KEYS.statusConfig),
  )
  if (statusConfig.length === 0) {
    statusConfig = DEFAULT_STATUS_CONFIG.map((s) => ({ ...s }))
    setUserData(WARRANTY_USER, KEYS.statusConfig, statusConfig)
  }

  return {
    communities: parseCommunities(getUserData(WARRANTY_USER, KEYS.communities)),
    homes: parseHomes(getUserData(WARRANTY_USER, KEYS.homes)),
    tickets: parseTickets(getUserData(WARRANTY_USER, KEYS.tickets)),
    contractors: parseContractors(getUserData(WARRANTY_USER, KEYS.contractors)),
    statusConfig,
    ticketsView: readTicketsView(getUserData(WARRANTY_USER, KEYS.ticketsView)),
  }
}

function initialSnapshotPlaceholder(): Snapshot {
  return {
    communities: [],
    homes: [],
    tickets: [],
    contractors: [],
    statusConfig: DEFAULT_STATUS_CONFIG.map((s) => ({ ...s })),
    ticketsView: 'list',
  }
}

let snapshot: Snapshot = initialSnapshotPlaceholder()
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function writeSnapshot(next: Snapshot) {
  setUserData(WARRANTY_USER, KEYS.communities, next.communities)
  setUserData(WARRANTY_USER, KEYS.homes, next.homes)
  setUserData(WARRANTY_USER, KEYS.tickets, next.tickets)
  setUserData(WARRANTY_USER, KEYS.contractors, next.contractors)
  setUserData(WARRANTY_USER, KEYS.statusConfig, next.statusConfig)
  setUserData(WARRANTY_USER, KEYS.ticketsView, next.ticketsView)
  snapshot = readSnapshot()
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot(): Snapshot {
  return snapshot
}

function getServerSnapshot(): Snapshot {
  return {
    communities: [],
    homes: [],
    tickets: [],
    contractors: [],
    statusConfig: DEFAULT_STATUS_CONFIG,
    ticketsView: 'list',
  }
}

export function refreshWarrantyFromStorage() {
  snapshot = readSnapshot()
  emit()
}

let warrantyKvDebounce: ReturnType<typeof setTimeout> | null = null
function scheduleWarrantyReloadFromKv() {
  if (warrantyKvDebounce) clearTimeout(warrantyKvDebounce)
  warrantyKvDebounce = setTimeout(() => {
    warrantyKvDebounce = null
    refreshWarrantyFromStorage()
  }, 48)
}

type WarrantyContextValue = Snapshot & {
  upsertCommunity: (c: Community) => void
  deleteCommunity: (id: string) => void
  upsertHome: (h: Home) => void
  deleteHome: (id: string) => void
  upsertTicket: (t: Ticket) => void
  deleteTicket: (id: string) => void
  patchTicket: (id: string, patch: Partial<Ticket>) => void
  upsertContractor: (c: Contractor) => void
  deleteContractor: (id: string) => void
  setStatusConfig: (items: StatusConfigItem[]) => void
  setTicketsView: (mode: TicketsViewMode) => void
  reorderStatuses: (orderedIds: string[]) => void
}

const WarrantyContext = createContext<WarrantyContextValue | null>(null)

export function WarrantyProvider({ children }: { children: ReactNode }) {
  useEffect(() => subscribeKv(scheduleWarrantyReloadFromKv), [])

  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const upsertCommunity = useCallback((c: Community) => {
    const next = { ...snapshot }
    const i = next.communities.findIndex((x) => x.id === c.id)
    if (i >= 0) next.communities = next.communities.map((x) => (x.id === c.id ? c : x))
    else next.communities = [...next.communities, c]
    writeSnapshot(next)
  }, [])

  const deleteCommunity = useCallback((id: string) => {
    const next = {
      ...snapshot,
      communities: snapshot.communities.filter((c) => c.id !== id),
      homes: snapshot.homes.filter((h) => h.communityId !== id),
      tickets: snapshot.tickets.filter((t) => t.communityId !== id),
    }
    writeSnapshot(next)
  }, [])

  const upsertHome = useCallback((h: Home) => {
    const next = { ...snapshot }
    const i = next.homes.findIndex((x) => x.id === h.id)
    if (i >= 0) next.homes = next.homes.map((x) => (x.id === h.id ? h : x))
    else next.homes = [...next.homes, h]
    writeSnapshot(next)
  }, [])

  const deleteHome = useCallback((id: string) => {
    const next = {
      ...snapshot,
      homes: snapshot.homes.filter((h) => h.id !== id),
      tickets: snapshot.tickets.filter((t) => t.homeId !== id),
    }
    writeSnapshot(next)
  }, [])

  const upsertTicket = useCallback((t: Ticket) => {
    const next = { ...snapshot }
    const i = next.tickets.findIndex((x) => x.id === t.id)
    if (i >= 0) next.tickets = next.tickets.map((x) => (x.id === t.id ? t : x))
    else next.tickets = [...next.tickets, t]
    writeSnapshot(next)
  }, [])

  const deleteTicket = useCallback((id: string) => {
    const next = {
      ...snapshot,
      tickets: snapshot.tickets.filter((t) => t.id !== id),
    }
    writeSnapshot(next)
  }, [])

  const patchTicket = useCallback((id: string, patch: Partial<Ticket>) => {
    const next = {
      ...snapshot,
      tickets: snapshot.tickets.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t,
      ),
    }
    writeSnapshot(next)
  }, [])

  const upsertContractor = useCallback((c: Contractor) => {
    const next = { ...snapshot }
    const i = next.contractors.findIndex((x) => x.id === c.id)
    if (i >= 0)
      next.contractors = next.contractors.map((x) => (x.id === c.id ? c : x))
    else next.contractors = [...next.contractors, c]
    writeSnapshot(next)
  }, [])

  const deleteContractor = useCallback((id: string) => {
    const next = {
      ...snapshot,
      contractors: snapshot.contractors.filter((c) => c.id !== id),
      tickets: snapshot.tickets.map((t) =>
        t.assignedContractorId === id
          ? { ...t, assignedContractorId: null, updatedAt: nowIso() }
          : t,
      ),
    }
    writeSnapshot(next)
  }, [])

  const setStatusConfig = useCallback((items: StatusConfigItem[]) => {
    const next = {
      ...snapshot,
      statusConfig: sortStatusConfig(items.map((s, i) => ({ ...s, order: i }))),
    }
    writeSnapshot(next)
  }, [])

  const setTicketsView = useCallback((mode: TicketsViewMode) => {
    const next = { ...snapshot, ticketsView: mode }
    writeSnapshot(next)
  }, [])

  const reorderStatuses = useCallback((orderedIds: string[]) => {
    const map = new Map(snapshot.statusConfig.map((s) => [s.id, s]))
    const nextItems: StatusConfigItem[] = []
    orderedIds.forEach((id, order) => {
      const s = map.get(id)
      if (s) nextItems.push({ ...s, order })
    })
    for (const s of snapshot.statusConfig) {
      if (!orderedIds.includes(s.id)) nextItems.push({ ...s, order: nextItems.length })
    }
    writeSnapshot({
      ...snapshot,
      statusConfig: sortStatusConfig(nextItems),
    })
  }, [])

  const value = useMemo<WarrantyContextValue>(
    () => ({
      ...snap,
      upsertCommunity,
      deleteCommunity,
      upsertHome,
      deleteHome,
      upsertTicket,
      deleteTicket,
      patchTicket,
      upsertContractor,
      deleteContractor,
      setStatusConfig,
      setTicketsView,
      reorderStatuses,
    }),
    [
      snap,
      upsertCommunity,
      deleteCommunity,
      upsertHome,
      deleteHome,
      upsertTicket,
      deleteTicket,
      patchTicket,
      upsertContractor,
      deleteContractor,
      setStatusConfig,
      setTicketsView,
      reorderStatuses,
    ],
  )

  return (
    <WarrantyContext.Provider value={value}>{children}</WarrantyContext.Provider>
  )
}

export function useWarranty(): WarrantyContextValue {
  const ctx = useContext(WarrantyContext)
  if (!ctx) throw new Error('useWarranty must be used within WarrantyProvider')
  return ctx
}
