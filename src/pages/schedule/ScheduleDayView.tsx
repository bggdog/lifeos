import { Text } from '@heroui/react'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ScheduleEvent } from './types'
import {
  GRID_START_MIN,
  SCHEDULE_FIRST_HOUR,
  SCHEDULE_LAST_HOUR,
  categoryLeftBorderClass,
  clockMinutes,
  currentTimeLineTopPx,
} from './types'
import { layoutEventOnDay, totalGridHeightPx } from './gridLayout'
import { useScheduleSlotHeight } from './layoutHooks'
import { useTimeGridDrag } from './useTimeGridDrag'

function formatHourLabel(h: number): string {
  const d = new Date()
  d.setHours(h, 0, 0, 0)
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

type Props = {
  dayISO: string
  todayISO: string
  events: ScheduleEvent[]
  onCreateFromGrid: (payload: {
    date: string
    startTime: string
    endTime: string
  }) => void
  onEventPress: (e: ScheduleEvent) => void
}

export function ScheduleDayView({
  dayISO,
  todayISO,
  events,
  onCreateFromGrid,
  onEventPress,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const laneRef = useRef<HTMLDivElement>(null)
  const slotPx = useScheduleSlotHeight(laneRef)
  const [clockMs, setClockMs] = useState(() => Date.now())
  const isToday = dayISO === todayISO

  useEffect(() => {
    const id = window.setInterval(() => setClockMs(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const nowLine = isToday
    ? currentTimeLineTopPx(new Date(clockMs), slotPx)
    : null

  const { ghost, selectNone, handlers } = useTimeGridDrag({
    laneRef,
    slotHeightPx: slotPx,
    onDragCreate: (date, start, end) =>
      onCreateFromGrid({ date, startTime: start, endTime: end }),
    onClickCreate: (date, start, end) =>
      onCreateFromGrid({ date, startTime: start, endTime: end }),
    resolveDateISO: () => dayISO,
  })

  useLayoutEffect(() => {
    const sc = scrollRef.current
    if (!sc) return
    const targetMin = isToday
      ? clockMinutes(new Date())
      : 8 * 60
    const clamped = Math.max(
      GRID_START_MIN,
      Math.min(targetMin, SCHEDULE_LAST_HOUR * 60),
    )
    const y = ((clamped - GRID_START_MIN) / 60) * slotPx - 32
    sc.scrollTop = Math.max(0, y)
  }, [dayISO, isToday, slotPx])

  const hours = useMemo(
    () =>
      Array.from(
        { length: SCHEDULE_LAST_HOUR - SCHEDULE_FIRST_HOUR + 1 },
        (_, i) => SCHEDULE_FIRST_HOUR + i,
      ),
    [],
  )

  const layouts = useMemo(() => {
    return events
      .map((e) => {
        const layout = layoutEventOnDay(e, dayISO, slotPx)
        return layout ? { e, ...layout } : null
      })
      .filter(Boolean) as { e: ScheduleEvent; top: number; height: number }[]
  }, [events, dayISO, slotPx])

  const gridH = totalGridHeightPx(slotPx)
  const showEmpty = layouts.length === 0

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-width:thin]"
      >
        <div className="relative mx-auto w-full max-w-3xl min-w-0 px-2 pb-12 pt-1 sm:px-3 md:px-4">
          <div
            className="relative grid min-w-0 [grid-template-columns:minmax(3.25rem,3.75rem)_minmax(0,1fr)]"
            style={{ minHeight: gridH }}
          >
            <div className="sticky left-0 z-20 shrink-0 border-r border-border/50 bg-background">
              {hours.map((h) => (
                <div
                  key={h}
                  className="flex items-end justify-end border-b border-border/25 pr-1.5 pb-0.5 text-right text-[10px] font-medium tabular-nums leading-none text-foreground/50 sm:pr-2 sm:text-xs"
                  style={{ height: slotPx }}
                >
                  {formatHourLabel(h)}
                </div>
              ))}
            </div>
            <div
              ref={laneRef}
              className={`relative min-h-0 min-w-0 touch-none ${selectNone ? 'select-none' : ''}`}
              style={{ minHeight: gridH }}
              {...handlers}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  aria-hidden
                  className="pointer-events-none absolute right-0 left-0 border-b border-border/25"
                  style={{
                    top: (h - SCHEDULE_FIRST_HOUR) * slotPx,
                    height: slotPx,
                  }}
                />
              ))}
              {showEmpty ? (
                <div
                  className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 px-4 text-center"
                  aria-hidden
                >
                  <Calendar
                    className="size-9 text-foreground/25"
                    strokeWidth={1.5}
                  />
                  <Text className="max-w-[14rem] text-sm leading-snug text-foreground/45">
                    Nothing scheduled — enjoy the quiet
                  </Text>
                </div>
              ) : null}
              {ghost && ghost.dateISO === dayISO ? (
                <div
                  className="pointer-events-none absolute right-1 left-1 z-[3] overflow-hidden rounded-lg border border-dashed border-primary/60 bg-primary/15 px-2 py-1"
                  style={{
                    top: ghost.top,
                    height: ghost.height,
                    marginLeft: 2,
                    marginRight: 2,
                  }}
                >
                  <Text className="text-xs font-semibold text-primary">
                    {ghost.label}
                  </Text>
                </div>
              ) : null}
              {layouts.map(({ e, top, height }) => (
                <motion.button
                  key={e.id}
                  type="button"
                  data-schedule-event
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18 }}
                  className={`absolute right-1 left-1 z-[1] min-h-0 min-w-0 overflow-hidden rounded-lg border border-border/60 bg-background py-1.5 pr-2 pl-2 text-left shadow-sm dark:bg-surface ${categoryLeftBorderClass(e.category)} border-l-[3px]`}
                  style={{ top, height, marginLeft: 2, marginRight: 2 }}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    onEventPress(e)
                  }}
                >
                  <Text className="line-clamp-2 text-sm font-bold leading-tight">
                    {e.title}
                  </Text>
                  <Text className="mt-0.5 text-[10px] tabular-nums text-foreground/50">
                    {e.startTime} – {e.endTime}
                  </Text>
                </motion.button>
              ))}
              {nowLine != null ? (
                <div
                  className="pointer-events-none absolute right-0 left-0 z-[2] border-t-2 border-red-500"
                  style={{ top: nowLine }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
