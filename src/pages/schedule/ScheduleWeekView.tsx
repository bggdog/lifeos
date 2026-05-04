import { Text } from '@heroui/react'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ScheduleEvent } from './types'
import {
  DAY_LABELS,
  GRID_START_MIN,
  SCHEDULE_FIRST_HOUR,
  SCHEDULE_LAST_HOUR,
  addDays,
  categoryLeftBorderClass,
  clockMinutes,
  currentTimeLineTopPx,
  toISODate,
  weekDaysFromStart,
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
  weekStart: Date
  threeCenter: Date
  isNarrow: boolean
  todayISO: string
  events: ScheduleEvent[]
  onCreateFromGrid: (payload: {
    date: string
    startTime: string
    endTime: string
  }) => void
  onEventPress: (e: ScheduleEvent) => void
}

export function ScheduleWeekView({
  weekStart,
  threeCenter,
  isNarrow,
  todayISO,
  events,
  onCreateFromGrid,
  onEventPress,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const laneRef = useRef<HTMLDivElement>(null)
  const slotPx = useScheduleSlotHeight(laneRef)
  const [clockMs, setClockMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setClockMs(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const desktopDays = useMemo(() => weekDaysFromStart(weekStart), [weekStart])
  const mobileDays = useMemo(
    () => [
      addDays(threeCenter, -1),
      new Date(threeCenter),
      addDays(threeCenter, 1),
    ],
    [threeCenter],
  )

  const columns = isNarrow ? mobileDays : desktopDays
  const columnISOs = columns.map(toISODate)
  const nCol = columnISOs.length

  const resolveDateISO = useCallback(
    (clientX: number) => {
      const lane = laneRef.current
      if (!lane || nCol === 0) return null
      const r = lane.getBoundingClientRect()
      const x = clientX - r.left
      let i = Math.floor((x / r.width) * nCol)
      i = Math.max(0, Math.min(nCol - 1, i))
      return columnISOs[i] ?? null
    },
    [columnISOs, nCol],
  )

  const { ghost, selectNone, handlers } = useTimeGridDrag({
    laneRef,
    slotHeightPx: slotPx,
    onDragCreate: (date, start, end) =>
      onCreateFromGrid({ date, startTime: start, endTime: end }),
    onClickCreate: (date, start, end) =>
      onCreateFromGrid({ date, startTime: start, endTime: end }),
    resolveDateISO: (clientX) => resolveDateISO(clientX) ?? columnISOs[0]!,
  })

  const isCurrentSpan = useMemo(() => {
    if (isNarrow) {
      return columnISOs.includes(todayISO)
    }
    const ws = toISODate(weekStart)
    const we = toISODate(addDays(weekStart, 6))
    return todayISO >= ws && todayISO <= we
  }, [isNarrow, columnISOs, weekStart, todayISO])

  const nowLine = isCurrentSpan
    ? currentTimeLineTopPx(new Date(clockMs), slotPx)
    : null

  useLayoutEffect(() => {
    const sc = scrollRef.current
    if (!sc) return
    const isSpanToday = columnISOs.includes(todayISO)
    const targetMin = isSpanToday
      ? clockMinutes(new Date())
      : 8 * 60
    const clamped = Math.max(
      GRID_START_MIN,
      Math.min(targetMin, SCHEDULE_LAST_HOUR * 60),
    )
    const y = ((clamped - GRID_START_MIN) / 60) * slotPx - 32
    sc.scrollTop = Math.max(0, y)
  }, [columnISOs, isNarrow, todayISO, weekStart, threeCenter, slotPx])

  const hours = useMemo(
    () =>
      Array.from(
        { length: SCHEDULE_LAST_HOUR - SCHEDULE_FIRST_HOUR + 1 },
        (_, i) => SCHEDULE_FIRST_HOUR + i,
      ),
    [],
  )

  const gridH = totalGridHeightPx(slotPx)
  const gridTemplate = `repeat(${nCol}, minmax(0, 1fr))`

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-width:thin]"
      >
        <div
          className="sticky top-0 z-30 grid min-w-0 border-b border-border/50 bg-background shadow-sm"
          style={{
            gridTemplateColumns: 'minmax(3.25rem,3.75rem) minmax(0,1fr)',
          }}
        >
          <div className="border-r border-border/50 bg-background" aria-hidden />
          <div
            className="grid min-w-0"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {columns.map((d) => {
              const iso = toISODate(d)
              const today = iso === todayISO
              const dow = isNarrow
                ? undefined
                : DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]
              return (
                <div
                  key={iso}
                  className="min-w-0 border-l border-border/25 px-0.5 py-2 text-center first:border-l-0"
                >
                  {dow ? (
                    <Text className="text-[10px] font-medium uppercase tracking-wide text-foreground/45">
                      {dow}
                    </Text>
                  ) : null}
                  <div className="mt-0.5 flex justify-center">
                    <span className="relative flex size-9 items-center justify-center">
                      {today ? (
                        <span
                          className="absolute size-8 rounded-full bg-primary shadow-sm"
                          aria-hidden
                        />
                      ) : null}
                      <span
                        className={`relative z-10 text-sm font-semibold tabular-nums ${
                          today ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative min-w-0 px-1 pb-12 pt-1 sm:px-2">
          <div
            className="relative grid min-h-0 min-w-0"
            style={{
              gridTemplateColumns: 'minmax(3.25rem,3.75rem) minmax(0,1fr)',
              minHeight: gridH,
            }}
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
              <div
                className="relative grid h-full min-h-0 w-full min-w-0"
                style={{ gridTemplateColumns: gridTemplate, minHeight: gridH }}
              >
                {columnISOs.map((iso) => (
                  <div
                    key={iso}
                    className="relative min-h-0 min-w-0 border-l border-border/20 first:border-l-0"
                    style={{ minHeight: gridH }}
                  >
                    {hours.map((h) => (
                      <div
                        key={`${iso}-${h}`}
                        aria-hidden
                        className="pointer-events-none absolute right-0 left-0 border-b border-border/25"
                        style={{
                          top: (h - SCHEDULE_FIRST_HOUR) * slotPx,
                          height: slotPx,
                        }}
                      />
                    ))}
                    {events.map((e) => {
                      const layout = layoutEventOnDay(e, iso, slotPx)
                      if (!layout) return null
                      return (
                        <motion.button
                          key={`${e.id}-${iso}`}
                          type="button"
                          data-schedule-event
                          layout
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.16 }}
                          className={`absolute right-0.5 left-0.5 z-[1] min-h-0 min-w-0 overflow-hidden rounded-lg border border-border/60 bg-background py-1 pr-1.5 pl-1.5 text-left shadow-sm dark:bg-surface ${categoryLeftBorderClass(e.category)} border-l-[3px]`}
                          style={{
                            top: layout.top,
                            height: layout.height,
                          }}
                          onClick={(ev) => {
                            ev.stopPropagation()
                            onEventPress(e)
                          }}
                        >
                          <Text className="line-clamp-2 text-[11px] font-bold leading-tight sm:text-xs">
                            {e.title}
                          </Text>
                          <Text className="mt-0.5 text-[9px] tabular-nums text-foreground/50 sm:text-[10px]">
                            {e.startTime}–{e.endTime}
                          </Text>
                        </motion.button>
                      )
                    })}
                  </div>
                ))}
              </div>
              {ghost ? (
                <div
                  className="pointer-events-none absolute inset-0 z-[3] grid min-w-0"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  {columnISOs.map((iso) => (
                    <div key={`g-${iso}`} className="relative min-w-0">
                      {iso === ghost.dateISO ? (
                        <div
                          className="pointer-events-none absolute right-0.5 left-0.5 overflow-hidden rounded-lg border border-dashed border-primary/60 bg-primary/15 px-1.5 py-1"
                          style={{
                            top: ghost.top,
                            height: ghost.height,
                          }}
                        >
                          <Text className="text-[10px] font-semibold leading-tight text-primary sm:text-xs">
                            {ghost.label}
                          </Text>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
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
