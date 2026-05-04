import type { LifeOsUser } from '../../context/UserContext'

export type EventCategory =
  | 'Work'
  | 'Personal'
  | 'Health'
  | 'Creative'
  | 'Warranty'

export type ScheduleEvent = {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  category: EventCategory
}

export const EVENTS_KEY = 'events'

/** Persisted via `getUserData(user, SCHEDULE_VIEW_KEY)` → e.g. `Branson.schedule.view` */
export const SCHEDULE_VIEW_KEY = 'schedule.view'

export type ScheduleView = 'day' | 'week' | 'month'

export function parseScheduleView(raw: unknown): ScheduleView {
  if (raw === 'day' || raw === 'week' || raw === 'month') {
    return raw
  }
  if (raw === 'agenda') {
    return 'week'
  }
  return 'week'
}

export const SCHEDULE_FIRST_HOUR = 6
export const SCHEDULE_LAST_HOUR = 22
export const LANE_HEIGHT_PX = 56

/** First minute included in the grid (6:00 AM). */
export const GRID_START_MIN = SCHEDULE_FIRST_HOUR * 60
/** First minute after the grid (11:00 PM); times &lt; this are shown. */
export const GRID_END_MIN = (SCHEDULE_LAST_HOUR + 1) * 60

/** Full-day grid row count (one row per clock hour shown). */
export const SCHEDULE_GRID_ROW_COUNT = (GRID_END_MIN - GRID_START_MIN) / 60

export function clockMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

/** Y offset in px for the “now” line, or null if outside the schedule grid. */
export function currentTimeLineTopPx(
  now: Date = new Date(),
  laneHeightPx: number = LANE_HEIGHT_PX,
): number | null {
  const m = clockMinutes(now)
  if (m < GRID_START_MIN || m >= GRID_END_MIN) return null
  return ((m - GRID_START_MIN) / 60) * laneHeightPx
}

export const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return x
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** 42 cells (Mon-first), each with calendar date and whether it falls in `monthAnchor`'s month */
export function getMonthGrid(monthAnchor: Date): { date: Date; inMonth: boolean }[] {
  const first = startOfMonth(monthAnchor)
  const gridStart = startOfWeekMonday(first)
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(gridStart, i)
    return {
      date,
      inMonth: date.getMonth() === monthAnchor.getMonth(),
    }
  })
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b)
}

export function compareEventDateTime(a: ScheduleEvent, b: ScheduleEvent): number {
  const da = a.date.localeCompare(b.date)
  if (da !== 0) return da
  return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
}

export function weekDaysFromStart(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function formatDayHeading(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function formatWeekRangeLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6)
  const sameMonth = weekStart.getMonth() === end.getMonth()
  const a = weekStart.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  const b = end.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
  })
  return `${a} – ${b}`
}

/** 3px left accent for event cards (category color). */
export function categoryLeftBorderClass(c: EventCategory): string {
  switch (c) {
    case 'Work':
      return 'border-l-violet-500'
    case 'Personal':
      return 'border-l-teal-500'
    case 'Health':
      return 'border-l-emerald-500'
    case 'Creative':
      return 'border-l-amber-500'
    case 'Warranty':
      return 'border-l-rose-400'
    default:
      return 'border-l-foreground/30'
  }
}

export function categoryDotClass(c: EventCategory): string {
  switch (c) {
    case 'Work':
      return 'bg-violet-500'
    case 'Personal':
      return 'bg-teal-500'
    case 'Health':
      return 'bg-emerald-500'
    case 'Creative':
      return 'bg-amber-500'
    case 'Warranty':
      return 'bg-rose-400'
    default:
      return 'bg-foreground/30'
  }
}

export function categoryCardClass(c: EventCategory): string {
  switch (c) {
    case 'Work':
      return 'border-violet-400/70 bg-violet-50/90 text-violet-950 dark:border-violet-600/60 dark:bg-violet-950/40 dark:text-violet-50'
    case 'Personal':
      return 'border-teal-400/70 bg-teal-50/90 text-teal-950 dark:border-teal-600/60 dark:bg-teal-950/40 dark:text-teal-50'
    case 'Health':
      return 'border-emerald-400/70 bg-emerald-50/90 text-emerald-950 dark:border-emerald-600/60 dark:bg-emerald-950/40 dark:text-emerald-50'
    case 'Creative':
      return 'border-amber-400/70 bg-amber-50/90 text-amber-950 dark:border-amber-600/60 dark:bg-amber-950/40 dark:text-amber-50'
    case 'Warranty':
      return 'border-rose-400/80 bg-rose-50/90 text-rose-950 dark:border-rose-500/60 dark:bg-rose-950/40 dark:text-rose-50'
    default:
      return 'border-border bg-surface'
  }
}

export function defaultCategories(user: LifeOsUser | null): EventCategory[] {
  const base: EventCategory[] = ['Work', 'Personal', 'Health', 'Creative']
  if (user === 'Kelsee') base.push('Warranty')
  return base
}

export const TIME_OPTIONS: string[] = (() => {
  const out: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return out
})()

export function isValidEvent(e: unknown): e is ScheduleEvent {
  if (!e || typeof e !== 'object') return false
  const o = e as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.description === 'string' &&
    typeof o.date === 'string' &&
    typeof o.startTime === 'string' &&
    typeof o.endTime === 'string' &&
    typeof o.category === 'string'
  )
}
