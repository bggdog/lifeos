import { Button, Text } from '@heroui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { LifeOsUser } from '../context/UserContext'
import { useUser } from '../context/UserContext'
import { getUserData, setUserData } from '../lib/storage'
import type { EventDraft, EventModalMode } from './schedule/EventModal'
import { EventModal } from './schedule/EventModal'
import { ScheduleDayView } from './schedule/ScheduleDayView'
import { ScheduleMonthView } from './schedule/ScheduleMonthView'
import {
  addDaysToIso,
  scheduleDayNavLabel,
  weekNavLabel,
} from './schedule/scheduleNavHelpers'
import { useContainerNarrow } from './schedule/layoutHooks'
import { ScheduleWeekView } from './schedule/ScheduleWeekView'
import type { EventCategory, ScheduleEvent, ScheduleView } from './schedule/types'
import {
  EVENTS_KEY,
  SCHEDULE_VIEW_KEY,
  addDays,
  addMonths,
  defaultCategories,
  isValidEvent,
  parseISODate,
  parseScheduleView,
  startOfMonth,
  startOfWeekMonday,
  timeToMinutes,
  toISODate,
} from './schedule/types'

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

function readEventsForUser(
  user: LifeOsUser,
  allowed: EventCategory[],
): ScheduleEvent[] {
  return normalizeEvents(getUserData(user, EVENTS_KEY), allowed)
}

function ScheduleInner({ activeUser }: { activeUser: LifeOsUser }) {
  const allowedCategories = useMemo(
    () => defaultCategories(activeUser),
    [activeUser],
  )

  const [events, setEvents] = useState<ScheduleEvent[]>(() =>
    readEventsForUser(activeUser, allowedCategories),
  )

  const todayISO = toISODate(new Date())
  const layoutRootRef = useRef<HTMLDivElement>(null)
  const [modalPortalEl, setModalPortalEl] = useState<HTMLDivElement | null>(null)
  const isNarrow = useContainerNarrow(layoutRootRef, 768)

  const [view, setView] = useState<ScheduleView>(() =>
    parseScheduleView(getUserData(activeUser, SCHEDULE_VIEW_KEY)),
  )

  const setViewPersist = useCallback(
    (v: ScheduleView) => {
      setView(v)
      setUserData(activeUser, SCHEDULE_VIEW_KEY, v)
    },
    [activeUser],
  )

  const [dayISO, setDayISO] = useState(todayISO)
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()))
  const [threeCenter, setThreeCenter] = useState(() => parseISODate(todayISO))
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()))

  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => e.date === dayISO)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    [events, dayISO],
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<EventModalMode>('add')
  const [draft, setDraft] = useState<EventDraft | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalResetKey, setModalResetKey] = useState(0)

  const persist = useCallback(
    (next: ScheduleEvent[]) => {
      setEvents(next)
      setUserData(activeUser, EVENTS_KEY, next)
    },
    [activeUser],
  )

  const openAdd = useCallback((partial: Partial<EventDraft>) => {
    setModalMode('add')
    setEditingId(null)
    setDraft({
      title: '',
      description: '',
      date: toISODate(new Date()),
      startTime: '09:00',
      endTime: '10:00',
      category: 'Personal',
      ...partial,
    })
    setModalResetKey((k) => k + 1)
    setModalOpen(true)
  }, [])

  const onCreateFromGrid = useCallback(
    (p: { date: string; startTime: string; endTime: string }) => {
      openAdd({ date: p.date, startTime: p.startTime, endTime: p.endTime })
    },
    [openAdd],
  )

  const openEdit = useCallback((e: ScheduleEvent) => {
    setModalMode('edit')
    setEditingId(e.id)
    setDraft({
      title: e.title,
      description: e.description,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      category: e.category,
    })
    setModalResetKey((k) => k + 1)
    setModalOpen(true)
  }, [])

  const handleSaveDraft = useCallback(
    (d: EventDraft, id: string | null) => {
      let cat = d.category
      if (cat === 'Warranty' && activeUser !== 'Kelsee') {
        cat = 'Personal'
      }
      if (!id) {
        const next: ScheduleEvent = {
          id: crypto.randomUUID(),
          title: d.title,
          description: d.description,
          date: d.date,
          startTime: d.startTime,
          endTime: d.endTime,
          category: cat,
        }
        persist([...events, next])
      } else {
        persist(
          events.map((ev) =>
            ev.id === id
              ? {
                  ...ev,
                  title: d.title,
                  description: d.description,
                  date: d.date,
                  startTime: d.startTime,
                  endTime: d.endTime,
                  category: cat,
                }
              : ev,
          ),
        )
      }
    },
    [activeUser, events, persist],
  )

  const handleDelete = useCallback(
    (id: string) => {
      persist(events.filter((e) => e.id !== id))
    },
    [events, persist],
  )

  const jumpWeekToday = useCallback(() => {
    setWeekStart(startOfWeekMonday(new Date()))
  }, [])

  const monthTitle = monthAnchor.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const handleWeekPrev = () => {
    if (isNarrow) {
      setThreeCenter((d) => addDays(d, -1))
    } else {
      setWeekStart((w) => addDays(w, -7))
    }
  }

  const handleWeekNext = () => {
    if (isNarrow) {
      setThreeCenter((d) => addDays(d, 1))
    } else {
      setWeekStart((w) => addDays(w, 7))
    }
  }

  const handleWeekJumpToday = () => {
    jumpWeekToday()
    setThreeCenter(parseISODate(todayISO))
  }

  return (
    <div
      ref={layoutRootRef}
      className="@container/schedule relative isolate flex min-h-0 w-full min-w-0 flex-1 flex-col [container-type:inline-size]"
    >
      <header className="relative z-20 shrink-0 border-b border-border bg-background">
        <div className="mx-auto flex w-full min-w-[min(100%,18rem)] max-w-[100vw] flex-col gap-3 px-3 py-3 @[40rem]/schedule:flex-row @[40rem]/schedule:items-center @[40rem]/schedule:justify-between @[40rem]/schedule:gap-4 sm:px-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2 @[28rem]/schedule:flex-row @[28rem]/schedule:flex-wrap @[28rem]/schedule:items-center @[28rem]/schedule:gap-2">
          {view === 'day' ? (
            <>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                aria-label="Previous day"
                className="shrink-0"
                onPress={() => setDayISO(addDaysToIso(dayISO, -1))}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Text className="min-w-0 flex-1 truncate text-center text-base font-medium tracking-tight sm:text-left md:text-lg">
                {scheduleDayNavLabel(dayISO)}
              </Text>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                aria-label="Next day"
                className="shrink-0"
                onPress={() => setDayISO(addDaysToIso(dayISO, 1))}
              >
                <ChevronRight className="size-5" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0 rounded-full px-3 text-xs sm:ml-1"
                onPress={() => setDayISO(todayISO)}
              >
                Today
              </Button>
            </>
          ) : null}
          {view === 'week' ? (
            <>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                aria-label={isNarrow ? 'Previous days' : 'Previous week'}
                className="shrink-0"
                onPress={handleWeekPrev}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Text className="min-w-0 flex-1 truncate text-center text-xs font-medium uppercase tracking-wide text-foreground/60 sm:text-left sm:normal-case md:text-sm">
                {weekNavLabel(isNarrow, weekStart, threeCenter)}
              </Text>
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0 rounded-full px-3 text-xs"
                onPress={handleWeekJumpToday}
              >
                Today
              </Button>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                aria-label={isNarrow ? 'Next days' : 'Next week'}
                className="shrink-0"
                onPress={handleWeekNext}
              >
                <ChevronRight className="size-5" />
              </Button>
            </>
          ) : null}
          {view === 'month' ? (
            <>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label="Previous month"
                  onPress={() => setMonthAnchor(addMonths(monthAnchor, -1))}
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label="Next month"
                  onPress={() => setMonthAnchor(addMonths(monthAnchor, 1))}
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
              <Text className="min-w-0 flex-1 truncate text-center text-sm font-medium md:text-base">
                {monthTitle}
              </Text>
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0 rounded-full text-xs"
                onPress={() => setMonthAnchor(startOfMonth(new Date()))}
              >
                Today
              </Button>
            </>
          ) : null}
          </div>

          <div
            role="group"
            aria-label="Calendar view: Day, Week, or Month"
            className="grid min-h-10 w-full min-w-0 shrink-0 grid-cols-3 gap-1 rounded-xl border border-border/60 bg-surface/80 p-1 @[40rem]/schedule:w-auto @[40rem]/schedule:min-w-[11.5rem]"
          >
          {(['day', 'week', 'month'] as const).map((v) => (
            <Button
              key={v}
              type="button"
              variant={view === v ? 'primary' : 'ghost'}
              size="sm"
              className="h-9 rounded-lg px-2 text-xs font-medium sm:px-3 sm:text-sm"
              onPress={() => setViewPersist(v)}
            >
              {v === 'day' ? 'Day' : v === 'week' ? 'Week' : 'Month'}
            </Button>
          ))}
          </div>
        </div>
      </header>

      <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden">
        {view === 'day' ? (
          <ScheduleDayView
            dayISO={dayISO}
            todayISO={todayISO}
            events={dayEvents}
            onCreateFromGrid={onCreateFromGrid}
            onEventPress={openEdit}
          />
        ) : null}
        {view === 'week' ? (
          <ScheduleWeekView
            weekStart={weekStart}
            threeCenter={threeCenter}
            isNarrow={Boolean(isNarrow)}
            todayISO={todayISO}
            events={events}
            onCreateFromGrid={onCreateFromGrid}
            onEventPress={openEdit}
          />
        ) : null}
        {view === 'month' ? (
          <ScheduleMonthView
            monthAnchor={monthAnchor}
            todayISO={todayISO}
            compactLayout={isNarrow}
            events={events}
            onAddDay={(iso) =>
              openAdd({ date: iso, startTime: '09:00', endTime: '10:00' })
            }
            onEditEvent={openEdit}
          />
        ) : null}

        <div
          ref={setModalPortalEl}
          className="pointer-events-none absolute inset-0 z-[240] min-h-0 min-w-0"
          aria-hidden={!modalOpen}
        />

        {modalOpen && draft ? (
          <EventModal
            portalContainer={modalPortalEl}
            onOpenChange={(open) => {
              setModalOpen(open)
              if (!open) setDraft(null)
            }}
            mode={modalMode}
            activeUser={activeUser}
            initialDraft={draft}
            editingId={editingId}
            onSave={handleSaveDraft}
            onDelete={handleDelete}
            resetKey={modalResetKey}
          />
        ) : null}
      </div>
    </div>
  )
}

export default function Schedule() {
  const { activeUser } = useUser()
  if (!activeUser) return null
  return <ScheduleInner key={activeUser} activeUser={activeUser} />
}
