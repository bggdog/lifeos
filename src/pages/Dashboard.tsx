import {
  Avatar,
  Card,
  Checkbox,
  Chip,
  ChipLabel,
  Label,
  Text,
  TextArea,
  TextField,
} from '@heroui/react'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  greetingForUser,
  todayLocalISO,
  type HeartCheckInEntry,
  useHeartCheckIn,
} from '../context/HeartCheckInContext'
import type { LifeOsUser } from '../context/UserContext'
import { useUser } from '../context/UserContext'
import { getUserData, setUserData, subscribeKv } from '../lib/storage'
import { CATEGORY_COLOR } from './goals/categoryStyles'
import {
  goalProgressPercent,
  sortGoalsByTarget,
  todayISO as goalsTodayISO,
} from './goals/goalUtils'
import type { Goal } from './goals/types'
import { loadGoals } from './goals/storage'
import type { EventCategory, ScheduleEvent } from './schedule/types'
import {
  EVENTS_KEY,
  categoryDotClass,
  defaultCategories,
  isValidEvent,
  timeToMinutes,
} from './schedule/types'
import { loadMergedTaskData, persistMerged } from './tasks/storage'
import { addDaysISO, sortTasksByOrder } from './tasks/types'
import type { Task, TaskList } from './tasks/types'
import { loadWarrantySnapshotFromStorage } from '../warranty/WarrantyContext'
import type { Community, Ticket } from '../warranty/types'
import {
  type ActivityItem,
  buildActivityFeed,
  communityProgress,
  isTerminalStatus,
  openTicketCount,
  todayLocalISO as warrantyTodayISO,
  addDaysISO as warrantyAddDaysISO,
} from '../warranty/utils'
import { statusChipClass } from '../warranty/statusStyles'

const MOTIVATION_LINES = [
  "What's the one thing that moves the needle today?",
  'Small steps compound. Keep going.',
  'Show up for the work. The rest follows.',
  'What would make today feel like a win?',
  'Protect one hour for deep work — you deserve it.',
  'Done beats perfect. Ship something small.',
  'Rest is part of the plan, not a reward.',
  'What can you simplify today?',
  'Pick one hard thing early; the day gets easier.',
  'Be kind to yourself — then get after it.',
  'Ask for help where it matters.',
  'Progress you can see beats hustle you can brag about.',
]

const gridContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
}

const gridItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function partnerOf(user: LifeOsUser): LifeOsUser {
  return user === 'Branson' ? 'Kelsee' : 'Branson'
}

function randomMotivationLine(): string {
  const i = Math.floor(Math.random() * MOTIVATION_LINES.length)
  return MOTIVATION_LINES[i] ?? MOTIVATION_LINES[0]!
}

function normalizeEvents(
  raw: unknown,
  allowedCategories: EventCategory[],
): ScheduleEvent[] {
  if (!Array.isArray(raw)) return []
  const allow = new Set(allowedCategories)
  return raw.filter(isValidEvent).map((e) => ({
    ...e,
    category: allow.has(e.category) ? e.category : 'Personal',
  }))
}

function formatFullDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function eventDateTime(dateISO: string, hm: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number)
  const [hh, mm] = hm.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm || 0, 0, 0)
}

function formatTimeRange(start: Date, end: Date): string {
  const o: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  }
  return `${start.toLocaleTimeString(undefined, o)} – ${end.toLocaleTimeString(undefined, o)}`
}

function formatHeartWhen(entry: HeartCheckInEntry): string {
  const t = new Date(entry.timestamp)
  const clock = t.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  const today = todayLocalISO()
  const yday = warrantyAddDaysISO(today, -1)
  if (entry.date === today) return `Today at ${clock}`
  if (entry.date === yday) return `Yesterday at ${clock}`
  const [y, m, d] = entry.date.split('-').map(Number)
  const pretty = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  return `${pretty} at ${clock}`
}

function focusStorageKey(dateISO: string): string {
  return `dashboard.focus.${dateISO}`
}

function readFocusText(user: LifeOsUser, dateISO: string): string {
  const raw = getUserData(user, focusStorageKey(dateISO))
  return typeof raw === 'string' ? raw : ''
}

function hasFocusEntry(user: LifeOsUser, dateISO: string): boolean {
  return readFocusText(user, dateISO).trim().length > 0
}

function computeFocusStreak(user: LifeOsUser, todayISO: string): number {
  let count = 0
  let d = todayISO
  if (hasFocusEntry(user, d)) {
    count++
    d = warrantyAddDaysISO(d, -1)
  } else {
    d = warrantyAddDaysISO(d, -1)
  }
  while (hasFocusEntry(user, d)) {
    count++
    if (count >= 999) return 999
    d = warrantyAddDaysISO(d, -1)
  }
  return Math.min(count, 999)
}

function formatRelativeShort(iso: string): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const sec = Math.round((Date.now() - t) / 1000)
  if (sec < 45) return 'Just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hours ago`
  const days = Math.round(hr / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function activityRowLabel(item: ActivityItem): string {
  if (item.kind === 'status') {
    const m = item.summary.match(/→\s*([^—\n]+)/)
    if (m) return `Status → ${m[1]!.trim()}`
    const setTo = item.summary.match(/Status set to\s+([^—\n]+)/i)
    if (setTo) return `Status → ${setTo[1]!.trim()}`
  }
  if (item.kind === 'comm') return 'Note added'
  if (item.kind === 'appointment') return 'Appointment scheduled'
  return item.summary.slice(0, 56)
}

function WidgetHeader({
  title,
  actionTo,
  actionLabel,
}: {
  title: string
  actionTo?: string
  actionLabel?: string
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-2">
      <Text className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </Text>
      {actionTo && actionLabel ? (
        <Link
          to={actionTo}
          className="shrink-0 text-xs font-medium text-foreground/45 transition-colors hover:text-foreground/75"
        >
          {actionLabel}
        </Link>
      ) : (
        <span className="inline-block min-w-[1px]" aria-hidden />
      )}
    </div>
  )
}

function MotionCard({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <motion.div variants={gridItem} className={className}>
      <Card.Root
        variant="default"
        className="h-full border border-border/60 bg-surface/35 shadow-sm dark:bg-surface/20"
      >
        <Card.Content className="p-4">{children}</Card.Content>
      </Card.Root>
    </motion.div>
  )
}

export default function Dashboard() {
  const { activeUser } = useUser()
  const navigate = useNavigate()
  const { getLatestPartnerCheckIn } = useHeartCheckIn()
  const [refreshKey, setRefreshKey] = useState(0)
  const [nowTs, setNowTs] = useState(() => Date.now())
  const [motivationLine] = useState(() => randomMotivationLine())
  const [focusDraft, setFocusDraft] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  const today = warrantyTodayISO()
  const allowedCategories = useMemo(
    () => defaultCategories(activeUser ?? null),
    [activeUser],
  )

  useEffect(() => {
    document.title = 'Home · LifeOS'
    return () => {
      document.title = 'LifeOS'
    }
  }, [])

  useEffect(() => {
    const onFocus = () => setRefreshKey((k) => k + 1)
    globalThis.addEventListener('focus', onFocus)
    return () => globalThis.removeEventListener('focus', onFocus)
  }, [])

  useEffect(
    () => subscribeKv(() => setRefreshKey((k) => k + 1)),
    [],
  )

  useEffect(() => {
    const id = globalThis.setInterval(() => setNowTs(Date.now()), 60_000)
    return () => globalThis.clearInterval(id)
  }, [])

  const merged = useMemo(() => {
    void refreshKey
    if (!activeUser) return { lists: [] as TaskList[], tasks: [] as Task[] }
    return loadMergedTaskData(activeUser)
  }, [activeUser, refreshKey])

  const events = useMemo(() => {
    void refreshKey
    if (!activeUser) return [] as ScheduleEvent[]
    return normalizeEvents(getUserData(activeUser, EVENTS_KEY), allowedCategories)
  }, [activeUser, allowedCategories, refreshKey])

  const goals = useMemo(() => {
    void refreshKey
    if (!activeUser) return [] as Goal[]
    return loadGoals(activeUser)
  }, [activeUser, refreshKey])

  useEffect(() => {
    if (!activeUser) return
    const v = readFocusText(activeUser, today)
    const id = requestAnimationFrame(() => {
      setFocusDraft(v)
    })
    return () => cancelAnimationFrame(id)
  }, [activeUser, today, refreshKey])

  useEffect(() => {
    if (!savedFlash) return
    const t = globalThis.setTimeout(() => setSavedFlash(false), 2000)
    return () => globalThis.clearTimeout(t)
  }, [savedFlash])

  const persistFocus = useCallback(() => {
    if (!activeUser) return
    setUserData(activeUser, focusStorageKey(today), focusDraft)
    setSavedFlash(true)
  }, [activeUser, focusDraft, today])

  const latestPartner = getLatestPartnerCheckIn()
  const partner = activeUser ? partnerOf(activeUser) : null

  const todayEvents = useMemo(() => {
    const now = new Date(nowTs)
    return events
      .filter((e) => e.date === today)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
      .map((e) => {
        const start = eventDateTime(e.date, e.startTime)
        const end = eventDateTime(e.date, e.endTime)
        const past = end.getTime() < now.getTime()
        const live =
          start.getTime() <= now.getTime() && now.getTime() <= end.getTime()
        return { e, start, end, past, live }
      })
  }, [events, today, nowTs])

  const weekEnd = warrantyAddDaysISO(today, 7)
  const upcomingWeek = useMemo(() => {
    const now = new Date(nowTs)
    const rows: {
      e: ScheduleEvent
      start: Date
      dayLabel: string
      dateISO: string
    }[] = []
    for (let i = 1; i <= 7; i++) {
      const dateISO = warrantyAddDaysISO(today, i)
      if (dateISO > weekEnd) break
      const dayStub = warrantyAddDaysISO(today, i)
      const [y, m, d] = dayStub.split('-').map(Number)
      const dt = new Date(y, m - 1, d)
      const dayLabel = dt.toLocaleDateString(undefined, { weekday: 'short' })
      for (const e of events.filter((x) => x.date === dateISO)) {
        const start = eventDateTime(e.date, e.startTime)
        const end = eventDateTime(e.date, e.endTime)
        if (end.getTime() < now.getTime()) continue
        rows.push({ e, start, dayLabel, dateISO })
      }
    }
    rows.sort(
      (a, b) =>
        a.dateISO.localeCompare(b.dateISO) ||
        timeToMinutes(a.e.startTime) - timeToMinutes(b.e.startTime),
    )
    return rows.slice(0, 5)
  }, [events, today, weekEnd, nowTs])

  const dueTodayTasks = useMemo(() => {
    const list = merged.tasks.filter(
      (t) => t.dueDate === today && t.dueDate != null,
    )
    const incom = sortTasksByOrder(list.filter((t) => !t.completed))
    const done = sortTasksByOrder(list.filter((t) => t.completed))
    return [...incom, ...done]
  }, [merged.tasks, today])

  const activeGoalsPreview = useMemo(() => {
    const ing = goals.filter((g) => g.status === 'inProgress')
    return sortGoalsByTarget(ing).slice(0, 4)
  }, [goals])

  const goalDueSoon = useCallback((g: Goal) => {
    if (!g.targetDate) return false
    const limit = addDaysISO(goalsTodayISO(), 7)
    return g.targetDate <= limit && g.targetDate >= goalsTodayISO()
  }, [])

  const toggleTask = useCallback(
    (task: Task, completed: boolean) => {
      if (!activeUser) return
      const next = merged.tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completed,
              completedAt: completed ? new Date().toISOString() : null,
            }
          : t,
      )
      persistMerged(activeUser, merged.lists, next)
      setRefreshKey((k) => k + 1)
    },
    [activeUser, merged.lists, merged.tasks],
  )

  const streak = activeUser ? computeFocusStreak(activeUser, today) : 0
  const todayHasFocus = activeUser ? hasFocusEntry(activeUser, today) : false

  const warrantySnap = useMemo(() => {
    void refreshKey
    if (activeUser !== 'Kelsee') return null
    return loadWarrantySnapshotFromStorage()
  }, [activeUser, refreshKey])

  const openTicketsData = useMemo(() => {
    if (!warrantySnap) return null
    const { tickets, statusConfig } = warrantySnap
    const open = tickets.filter((t) => !isTerminalStatus(t.status, statusConfig))
    const byStatus = new Map<string, number>()
    for (const t of open) {
      byStatus.set(t.status, (byStatus.get(t.status) ?? 0) + 1)
    }
    const rows = statusConfig
      .filter((s) => (byStatus.get(s.id) ?? 0) > 0)
      .map((s) => ({
        item: s,
        count: byStatus.get(s.id) ?? 0,
      }))
    return { openCount: open.length, rows }
  }, [warrantySnap])

  const followUpTickets = useMemo(() => {
    if (!warrantySnap) return []
    const { tickets, homes, statusConfig } = warrantySnap
    const homeMap = new Map(homes.map((h) => [h.id, h]))
    type Row = { ticket: Ticket; appt: Ticket['appointments'][number] }
    const acc: Row[] = []
    for (const t of tickets) {
      if (isTerminalStatus(t.status, statusConfig)) continue
      for (const a of t.appointments) {
        if (a.date < today || a.date > weekEnd) continue
        acc.push({ ticket: t, appt: a })
      }
    }
    acc.sort((x, y) => {
      const c = x.appt.date.localeCompare(y.appt.date)
      if (c !== 0) return c
      return x.appt.time.localeCompare(y.appt.time)
    })
    const seen = new Set<string>()
    const uniq: Row[] = []
    for (const r of acc) {
      if (seen.has(r.ticket.id)) continue
      seen.add(r.ticket.id)
      uniq.push(r)
      if (uniq.length >= 5) break
    }
    return uniq.map((r) => ({
      ticket: r.ticket,
      appt: r.appt,
      address: homeMap.get(r.ticket.homeId)?.address ?? '—',
    }))
  }, [warrantySnap, today, weekEnd])

  const activityFeed = useMemo(() => {
    if (!warrantySnap) return [] as ActivityItem[]
    return buildActivityFeed(warrantySnap.tickets, warrantySnap.homes, 5)
  }, [warrantySnap])

  const communitiesSnapshot = useMemo(() => {
    if (!warrantySnap) return [] as Community[]
    return warrantySnap.communities
  }, [warrantySnap])

  if (!activeUser) return null

  const heartTitle =
    partner === 'Kelsee' ? "Kelsee's Heart" : "Branson's Heart"
  const heartAccent =
    partner === 'Kelsee' ? 'ring-rose-400/80 bg-rose-500' : 'bg-[#534AB7] ring-violet-400/70'

  const focusAside =
    todayHasFocus ? null : (
      <Text className="mt-1 max-w-[11rem] text-[11px] leading-snug text-foreground/45">
        Write today&apos;s focus to keep your streak
      </Text>
    )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="shrink-0 border-b border-border/40 px-4 py-5 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Text className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {greetingForUser(activeUser)}
            </Text>
            <Text className="text-sm leading-relaxed text-foreground/65">
              {motivationLine}
            </Text>
          </div>
          <Text className="text-sm text-foreground/45">
            {formatFullDate(new Date())}
          </Text>
        </div>
      </header>

      <motion.div
        className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-4 p-4 md:grid-cols-2 md:p-5 xl:grid-cols-12 xl:gap-4"
        variants={gridContainer}
        initial="hidden"
        animate="show"
      >
        {/* Today schedule */}
        <MotionCard className="order-2 md:col-span-2 xl:col-span-8 xl:col-start-1">
          <WidgetHeader
            title="Today"
            actionTo="/schedule"
            actionLabel="Open Schedule →"
          />
          {todayEvents.length === 0 ? (
            <Text className="text-sm italic text-foreground/50">
              Nothing scheduled today — a rare gift.
            </Text>
          ) : (
            <ul className="space-y-2">
              {todayEvents.map(({ e, start, end, past, live }) => (
                <li
                  key={e.id}
                  className={`flex gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors ${
                    live
                      ? 'border-primary/25 bg-primary/[0.06]'
                      : past
                        ? 'opacity-50'
                        : ''
                  }`}
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${categoryDotClass(e.category)}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Text className="truncate text-sm font-medium text-foreground">
                        {e.title}
                      </Text>
                      {live ? (
                        <Chip size="sm" variant="soft" color="accent">
                          <ChipLabel className="text-[10px] font-semibold uppercase tracking-wide">
                            Now
                          </ChipLabel>
                        </Chip>
                      ) : null}
                    </div>
                    <Text className="text-xs text-foreground/50">
                      {formatTimeRange(start, end)}
                    </Text>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </MotionCard>

        {/* Partner heart */}
        <MotionCard className="order-3 md:col-span-2 xl:col-span-4 xl:col-start-9">
          <WidgetHeader
            title={heartTitle}
            actionTo="/hearts"
            actionLabel="See all →"
          />
          {latestPartner ? (
            <div className="relative rounded-xl border border-border/50 bg-background/60 p-3 dark:bg-background/30">
              {latestPartner.date === todayLocalISO() ? (
                <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
                  💛 Today
                </span>
              ) : null}
              <Avatar.Root
                size="sm"
                className={`mb-2 ring-2 ring-offset-2 ring-offset-background ${heartAccent}`}
              >
                <Avatar.Fallback className="text-xs font-semibold text-white">
                  {partner?.[0]}
                </Avatar.Fallback>
              </Avatar.Root>
              <Text className="font-serif text-[15px] italic leading-relaxed text-foreground/90">
                “{latestPartner.text}”
              </Text>
              <Text className="mt-2 text-xs text-foreground/45">
                {formatHeartWhen(latestPartner)}
              </Text>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <Avatar.Root size="md" className="ring-2 ring-border">
                <Avatar.Fallback className="text-sm font-medium text-foreground/50">
                  {partner?.[0]}
                </Avatar.Fallback>
              </Avatar.Root>
              <Text className="text-sm italic text-foreground/50">
                {partner === 'Kelsee'
                  ? "Kelsee hasn't checked in yet."
                  : "Branson hasn't checked in yet."}
              </Text>
            </div>
          )}
        </MotionCard>

        {/* Due today */}
        <MotionCard className="order-4 md:col-span-1 xl:col-span-4">
          <WidgetHeader
            title="Due Today"
            actionTo="/tasks"
            actionLabel="Go to Tasks →"
          />
          {dueTodayTasks.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-foreground/55">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>You&apos;re clear for today ✓</span>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {dueTodayTasks.slice(0, 5).map((t) => {
                  const listName =
                    merged.lists.find((l) => l.id === t.listId)?.name ?? 'List'
                  return (
                    <li
                      key={t.id}
                      className={`flex items-start gap-2 rounded-lg py-1 ${t.completed ? 'opacity-55' : ''}`}
                    >
                      <Checkbox
                        className="mt-0.5"
                        isSelected={t.completed}
                        onChange={(v) => toggleTask(t, v)}
                      />
                      <div className="min-w-0 flex-1">
                        <Text
                          className={`text-sm ${t.completed ? 'line-through' : ''}`}
                        >
                          {t.title}
                        </Text>
                        <Chip size="sm" variant="soft" className="mt-1 h-6">
                          <ChipLabel className="text-[10px] text-foreground/55">
                            {listName}
                          </ChipLabel>
                        </Chip>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {dueTodayTasks.length > 5 ? (
                <Link
                  to="/tasks"
                  className="mt-3 inline-block text-xs font-medium text-foreground/45 hover:text-foreground/75"
                >
                  {dueTodayTasks.length - 5} more →
                </Link>
              ) : null}
            </>
          )}
        </MotionCard>

        {/* This week */}
        <MotionCard className="order-5 md:col-span-1 xl:col-span-4">
          <WidgetHeader
            title="This Week"
            actionTo="/schedule"
            actionLabel="Open Schedule →"
          />
          {upcomingWeek.length === 0 ? (
            <Text className="text-sm italic text-foreground/50">
              Nothing coming up — enjoy the open week.
            </Text>
          ) : (
            <ul className="space-y-3">
              {upcomingWeek.map((row, idx) => {
                const prev = idx > 0 ? upcomingWeek[idx - 1] : null
                const showDayHeader = !prev || prev.dateISO !== row.dateISO
                return (
                  <li key={`${row.e.id}-${row.dateISO}-${idx}`}>
                    {showDayHeader ? (
                      <div
                        className={`mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/35 ${idx > 0 ? 'mt-3 border-t border-border/30 pt-3' : ''}`}
                      >
                        {row.dayLabel}{' '}
                        <span className="font-normal normal-case text-foreground/30">
                          {(() => {
                            const [y, m, d] = row.dateISO.split('-').map(Number)
                            return new Date(y, m - 1, d).toLocaleDateString(
                              undefined,
                              { month: 'short', day: 'numeric' },
                            )
                          })()}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <span
                        className={`mt-1 size-1.5 shrink-0 rounded-full ${categoryDotClass(row.e.category)}`}
                      />
                      <div className="min-w-0 flex-1">
                        <Text className="truncate text-sm font-medium">
                          {row.e.title}
                        </Text>
                        <Text className="text-xs text-foreground/45">
                          {row.start.toLocaleTimeString(undefined, {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </MotionCard>

        {/* Goals */}
        <MotionCard className="order-6 md:col-span-2 xl:col-span-4">
          <WidgetHeader
            title="Goals"
            actionTo="/goals"
            actionLabel="See all →"
          />
          {activeGoalsPreview.length === 0 ? (
            <Text className="text-sm italic text-foreground/50">
              No active goals — set one to get started.
            </Text>
          ) : (
            <ul className="space-y-3">
              {activeGoalsPreview.map((g) => {
                const pct = goalProgressPercent(g)
                const dot = CATEGORY_COLOR[g.category]
                return (
                  <li key={g.id} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: dot }}
                      />
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                        <Text className="truncate text-sm font-medium">
                          {g.title}
                        </Text>
                        <Text className="shrink-0 text-xs text-foreground/45">
                          {pct}%
                        </Text>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-4">
                      {goalDueSoon(g) ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
                          Due soon
                        </span>
                      ) : null}
                    </div>
                    <div className="pl-4">
                      <div className="h-1 overflow-hidden rounded-full bg-foreground/10">
                        <div
                          className="h-full rounded-full bg-primary transition-[width]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </MotionCard>

        {/* Focus */}
        <MotionCard className="order-7 md:col-span-2 xl:col-span-12">
          <WidgetHeader title={"Today's Focus"} />
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <TextField name="focus" className="w-full">
                <Label className="sr-only">Today&apos;s focus</Label>
                <TextArea
                  value={focusDraft}
                  onChange={(e) => setFocusDraft(e.target.value)}
                  onBlur={persistFocus}
                  placeholder="What do you want to accomplish today? Any intentions, priorities, or things to remember..."
                  rows={5}
                  className="w-full resize-y border-0 bg-transparent px-0 py-1 text-[15px] leading-relaxed shadow-none outline-none ring-0 placeholder:text-foreground/40 focus-visible:ring-0"
                />
              </TextField>
              <div className="mt-2 flex min-h-[1rem] items-center gap-2">
                {savedFlash ? (
                  <Text className="text-[11px] text-foreground/40 transition-opacity">
                    Auto-saved
                  </Text>
                ) : null}
              </div>
            </div>
            <div className="shrink-0 text-right xl:pl-6">
              <Text className="text-lg font-semibold tabular-nums">
                🔥 {streak} day streak
              </Text>
              {focusAside}
            </div>
          </div>
        </MotionCard>

        {/* Kelsee warranty */}
        {activeUser === 'Kelsee' && warrantySnap ? (
          <>
            <motion.div
              variants={gridItem}
              className="order-8 md:col-span-2 xl:col-span-12"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-6">
                <Text className="text-sm font-semibold tracking-tight text-foreground">
                  Warranty Overview
                </Text>
                <Link
                  to="/warranty"
                  className="text-xs font-medium text-foreground/45 hover:text-foreground/75"
                >
                  Go to Warranty →
                </Link>
              </div>
            </motion.div>

            <MotionCard className="order-9 md:col-span-1 xl:col-span-3">
              <WidgetHeader
                title="Open Tickets"
                actionTo="/warranty/tickets"
                actionLabel="View all →"
              />
              {openTicketsData && openTicketsData.openCount > 0 ? (
                <>
                  <Text className="text-4xl font-bold tabular-nums tracking-tight">
                    {openTicketsData.openCount}
                  </Text>
                  <ul className="mt-3 space-y-1.5">
                    {openTicketsData.rows.map(({ item, count }) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center gap-x-2 text-xs"
                      >
                        <span className="text-foreground/65">{item.label}</span>
                        <span className="font-medium text-foreground/35">·</span>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusChipClass(item)}`}
                        >
                          {count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Text className="text-sm text-foreground/50">No open tickets.</Text>
              )}
            </MotionCard>

            <MotionCard className="order-10 md:col-span-1 xl:col-span-3">
              <WidgetHeader title="Follow-ups This Week" actionTo="/warranty/tickets" actionLabel="" />
              {followUpTickets.length === 0 ? (
                <Text className="text-sm italic text-foreground/50">
                  No appointments this week.
                </Text>
              ) : (
                <ul className="space-y-2">
                  {followUpTickets.map(({ ticket, appt, address }) => (
                    <li key={ticket.id}>
                      <button
                        type="button"
                        className="w-full rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-foreground/[0.04]"
                        onClick={() =>
                          navigate(`/warranty/tickets/${ticket.id}`)
                        }
                      >
                        <Text className="truncate text-sm font-medium">
                          {ticket.title}
                        </Text>
                        <Text className="truncate text-xs text-foreground/45">
                          {address}
                        </Text>
                        <Text className="text-xs text-foreground/40">
                          {appt.date} · {appt.time}
                        </Text>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </MotionCard>

            <MotionCard className="order-11 md:col-span-1 xl:col-span-3">
              <WidgetHeader title="Recent Activity" actionTo="/warranty/tickets" actionLabel="" />
              {activityFeed.length === 0 ? (
                <Text className="text-sm text-foreground/50">No activity yet.</Text>
              ) : (
                <ul className="space-y-2">
                  {activityFeed.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="w-full rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-foreground/[0.04]"
                        onClick={() =>
                          navigate(`/warranty/tickets/${item.ticketId}`)
                        }
                      >
                        <Text className="truncate text-sm font-medium">
                          {item.title}
                        </Text>
                        <Text className="text-xs text-foreground/55">
                          {activityRowLabel(item)}
                        </Text>
                        <Text className="text-xs text-foreground/40">
                          {formatRelativeShort(item.changedAt)}
                        </Text>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </MotionCard>

            <MotionCard className="order-12 md:col-span-1 xl:col-span-3">
              <WidgetHeader
                title="Communities"
                actionTo="/warranty/communities"
                actionLabel=""
              />
              {communitiesSnapshot.length === 0 ? (
                <Text className="text-sm italic text-foreground/50">
                  No communities added yet.
                </Text>
              ) : (
                <ul className="space-y-3">
                  {communitiesSnapshot.map((c) => {
                    const open = openTicketCount(
                      warrantySnap.tickets,
                      c.id,
                      warrantySnap.statusConfig,
                    )
                    const pct = communityProgress(
                      warrantySnap.tickets,
                      c,
                      warrantySnap.statusConfig,
                    )
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="flex w-full flex-col gap-1 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-foreground/[0.04]"
                          onClick={() =>
                            navigate(`/warranty/communities/${c.id}`)
                          }
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Text className="truncate text-sm font-medium">
                              {c.name}
                            </Text>
                            <Chip size="sm" variant="soft">
                              <ChipLabel className="text-[10px]">{open} open</ChipLabel>
                            </Chip>
                          </div>
                          <div className="h-1 overflow-hidden rounded-full bg-foreground/10">
                            <div
                              className="h-full rounded-full bg-emerald-500/80"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <Text className="text-[11px] text-foreground/40">
                            {pct}% resolved
                          </Text>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </MotionCard>
          </>
        ) : null}
      </motion.div>
    </div>
  )
}
