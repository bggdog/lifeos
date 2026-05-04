import { Card, Text } from '@heroui/react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import type { HeartCheckInEntry } from '../context/HeartCheckInContext'
import {
  todayLocalISO,
  useHeartCheckIn,
} from '../context/HeartCheckInContext'
import type { LifeOsUser } from '../context/UserContext'
import { useUser } from '../context/UserContext'

const BRANSON = '#534AB7'
const KELSEE = '#C2185B'

function addDaysToISO(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function dateSectionLabel(dateISO: string, today: string): string {
  const yday = addDaysToISO(today, -1)
  if (dateISO === today) return 'Today'
  if (dateISO === yday) return 'Yesterday'
  const [y, m, d] = dateISO.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function partnerOf(user: LifeOsUser): LifeOsUser {
  return user === 'Branson' ? 'Kelsee' : 'Branson'
}

const feedContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
}

const feedItem = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 420, damping: 30 },
  },
}

function HeartEntryCard({ entry }: { entry: HeartCheckInEntry }) {
  const branson = entry.user === 'Branson'
  const accent = branson ? BRANSON : KELSEE
  const borderClass = branson ? 'border-l-[#534AB7]' : 'border-l-[#C2185B]'

  return (
    <motion.div variants={feedItem} layout>
      <Card.Root
        variant="default"
        className={`overflow-hidden border border-border/45 border-l-[3px] ${borderClass} bg-gradient-to-br from-rose-50/50 to-violet-50/35 shadow-sm dark:from-rose-950/20 dark:to-violet-950/15`}
      >
        <Card.Content className="flex gap-4 px-4 py-5 md:px-6 md:py-6">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white shadow-inner"
            style={{ backgroundColor: accent }}
            aria-hidden
          >
            {entry.user[0]}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <Text className="font-semibold text-foreground">{entry.user}</Text>
              <Text className="text-sm text-foreground/50">
                {formatTime(entry.timestamp)}
              </Text>
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
              {entry.text}
            </p>
          </div>
        </Card.Content>
      </Card.Root>
    </motion.div>
  )
}

function TodayPlaceholderCard({ name }: { name: string }) {
  return (
    <motion.div variants={feedItem} layout>
      <Card.Root
        variant="default"
        className="border border-dashed border-border/55 bg-background/60"
      >
        <Card.Content className="flex gap-4 px-4 py-5 md:px-6 md:py-6">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border/50 bg-transparent"
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 items-center">
            <Text className="text-sm italic text-foreground/50">
              {name} hasn&apos;t checked in yet today
            </Text>
          </div>
        </Card.Content>
      </Card.Root>
    </motion.div>
  )
}

function TodayStatusAvatars({
  hasCheckedInToday,
}: {
  hasCheckedInToday: (u: LifeOsUser) => boolean
}) {
  const users: LifeOsUser[] = ['Branson', 'Kelsee']
  return (
    <div className="flex items-center gap-2" aria-label="Today's check-ins">
      <Text className="hidden text-xs text-foreground/45 sm:inline">
        Today&apos;s check-ins
      </Text>
      <div className="flex items-center gap-1.5">
        {users.map((u) => {
          const done = hasCheckedInToday(u)
          const color = u === 'Branson' ? BRANSON : KELSEE
          return (
            <div key={u} className="relative flex items-center">
              <div
                className="flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {u[0]}
              </div>
              {done ? (
                <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background">
                  <Check className="size-2.5" strokeWidth={3} aria-hidden />
                </span>
              ) : (
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-foreground/20 ring-2 ring-background" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Hearts() {
  const { activeUser } = useUser()
  const {
    getCheckIns,
    hasCheckedInToday,
    markAllSeen,
  } = useHeartCheckIn()

  useEffect(() => {
    markAllSeen()
  }, [markAllSeen])

  const today = todayLocalISO()
  const sorted = useMemo(() => getCheckIns(), [getCheckIns])

  const grouped = useMemo(() => {
    const byDate = new Map<string, HeartCheckInEntry[]>()
    for (const e of sorted) {
      const arr = byDate.get(e.date) ?? []
      arr.push(e)
      byDate.set(e.date, arr)
    }
    for (const arr of byDate.values()) {
      arr.sort(
        (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
      )
    }
    const keys = [...byDate.keys()].sort((a, b) => b.localeCompare(a))
    return keys.map((date) => ({ date, entries: byDate.get(date)! }))
  }, [sorted])

  if (!activeUser) return null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-3 py-6 md:px-6 md:py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Text className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Hearts 💛
        </Text>
        <TodayStatusAvatars hasCheckedInToday={hasCheckedInToday} />
      </header>

      {sorted.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
          <span className="text-6xl" aria-hidden>
            💛
          </span>
          <Text className="max-w-sm text-lg font-medium text-foreground/85">
            This is where your hearts live.
          </Text>
          <Text className="max-w-sm text-sm text-foreground/55">
            Check-ins will appear here each day.
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-8 pb-16">
          {grouped.map(({ date, entries: dayEntries }) => {
            const usersToday = new Set(dayEntries.map((e) => e.user))
            const showPlaceholder =
              date === today &&
              usersToday.size === 1 &&
              (usersToday.has('Branson') || usersToday.has('Kelsee'))

            const missingPartner = showPlaceholder
              ? partnerOf([...usersToday][0] as LifeOsUser)
              : null

            return (
              <section key={date} className="scroll-mt-4">
                <div className="sticky top-0 z-10 -mx-1 mb-3 border-b border-border/30 bg-background/90 px-1 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                    {dateSectionLabel(date, today)}
                  </Text>
                </div>
                <motion.div
                  className="flex flex-col gap-4"
                  variants={feedContainer}
                  initial="hidden"
                  animate="show"
                >
                  {dayEntries.map((e) => (
                    <HeartEntryCard key={e.id} entry={e} />
                  ))}
                  {missingPartner ? (
                    <TodayPlaceholderCard name={missingPartner} />
                  ) : null}
                </motion.div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
