import type { Community, Home, Ticket } from './types'

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function todayLocalISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDaysISO(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + 'T12:00:00').getTime()
  const b = new Date(bISO + 'T12:00:00').getTime()
  return Math.round((b - a) / (24 * 60 * 60 * 1000))
}

export function isTerminalStatus(
  statusId: string,
  config: { id: string; label: string }[],
): boolean {
  const match = config.find((s) => s.id === statusId)
  if (!match) return false
  if (match.id === 'resolved' || match.id === 'closed') return true
  return /^(resolved|closed)\b/i.test(match.label.trim())
}

export function sortStatusConfig<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order)
}

/** 30-minute slots from 6:00 AM through 9:30 PM, 12h labels. */
export function timeSlots30(): string[] {
  const out: string[] = []
  for (let mins = 6 * 60; mins <= 21 * 60 + 30; mins += 30) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    const hr12 = h % 12 === 0 ? 12 : h % 12
    const ap = h < 12 ? 'AM' : 'PM'
    const mm = m === 0 ? '00' : '30'
    out.push(`${hr12}:${mm} ${ap}`)
  }
  return out
}

export type ActivityItem = {
  id: string
  ticketId: string
  title: string
  homeAddress: string
  summary: string
  changedAt: string
  kind: 'status' | 'appointment' | 'note' | 'comm' | 'update'
}

export function buildActivityFeed(
  tickets: Ticket[],
  homes: Home[],
  limit: number,
): ActivityItem[] {
  const homeMap = new Map(homes.map((h) => [h.id, h]))
  const items: ActivityItem[] = []

  for (const t of tickets) {
    const h = homeMap.get(t.homeId)
    const addr = h?.address ?? 'Unknown address'

    for (const sh of [...t.statusHistory].sort(
      (a, b) => Date.parse(b.changedAt) - Date.parse(a.changedAt),
    )) {
      items.push({
        id: `${t.id}-sh-${sh.id}`,
        ticketId: t.id,
        title: t.title,
        homeAddress: addr,
        summary: sh.fromStatus
          ? `Status: ${sh.fromStatus} → ${sh.toStatus}${sh.note ? ` — ${sh.note}` : ''}`
          : `Status set to ${sh.toStatus}${sh.note ? ` — ${sh.note}` : ''}`,
        changedAt: sh.changedAt,
        kind: 'status',
      })
    }
    for (const ap of t.appointments) {
      items.push({
        id: `${t.id}-ap-${ap.id}`,
        ticketId: t.id,
        title: t.title,
        homeAddress: addr,
        summary: `Appointment ${ap.date} ${ap.time}${ap.confirmed ? ' (confirmed)' : ''}`,
        changedAt: `${ap.date}T12:00:00.000Z`,
        kind: 'appointment',
      })
    }
    for (const c of t.communications) {
      items.push({
        id: `${t.id}-c-${c.id}`,
        ticketId: t.id,
        title: t.title,
        homeAddress: addr,
        summary: `${c.type}: ${c.content.slice(0, 120)}${c.content.length > 120 ? '…' : ''}`,
        changedAt: c.createdAt,
        kind: 'comm',
      })
    }
  }

  items.sort((a, b) => Date.parse(b.changedAt) - Date.parse(a.changedAt))
  return items.slice(0, limit)
}

export function openTicketCount(
  tickets: Ticket[],
  communityId: string | null,
  statusConfig: { id: string; label: string }[],
): number {
  return tickets.filter((t) => {
    if (communityId && t.communityId !== communityId) return false
    return !isTerminalStatus(t.status, statusConfig)
  }).length
}

export function resolvedTicketCount(
  tickets: Ticket[],
  communityId: string | null,
  statusConfig: { id: string; label: string }[],
): number {
  return tickets.filter((t) => {
    if (communityId && t.communityId !== communityId) return false
    return isTerminalStatus(t.status, statusConfig)
  }).length
}

export function communityProgress(
  tickets: Ticket[],
  c: Community,
  statusConfig: { id: string; label: string }[],
): number {
  const mine = tickets.filter((t) => t.communityId === c.id)
  if (mine.length === 0) return 100
  const r = mine.filter((t) => isTerminalStatus(t.status, statusConfig)).length
  return Math.round((r / mine.length) * 100)
}

export function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.append(ta)
    ta.select()
    try {
      document.execCommand('copy')
      resolve()
    } catch (e) {
      reject(e)
    }
    ta.remove()
  })
}
