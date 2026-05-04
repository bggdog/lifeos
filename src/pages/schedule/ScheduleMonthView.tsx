import {
  Button,
  Modal,
  Popover,
  Text,
  useOverlayState,
} from '@heroui/react'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { ScheduleEvent } from './types'
import {
  DAY_LABELS,
  categoryDotClass,
  compareEventDateTime,
  formatDayHeading,
  getMonthGrid,
  parseISODate,
  toISODate,
} from './types'

type Props = {
  monthAnchor: Date
  todayISO: string
  /** Narrow schedule shell (sidebar / phone) — bottom sheet vs centered modal. */
  compactLayout: boolean
  events: ScheduleEvent[]
  onAddDay: (iso: string) => void
  onEditEvent: (e: ScheduleEvent) => void
}

export function ScheduleMonthView({
  monthAnchor,
  todayISO,
  compactLayout,
  events,
  onAddDay,
  onEditEvent,
}: Props) {
  const [sheetISO, setSheetISO] = useState<string | null>(null)
  const sheetOverlay = useOverlayState({
    isOpen: sheetISO !== null,
    onOpenChange: (open) => {
      if (!open) setSheetISO(null)
    },
  })

  const grid = useMemo(() => getMonthGrid(monthAnchor), [monthAnchor])

  const eventsByDate = useMemo(() => {
    const m = new Map<string, ScheduleEvent[]>()
    for (const e of events) {
      const arr = m.get(e.date) ?? []
      arr.push(e)
      m.set(e.date, arr)
    }
    for (const arr of m.values()) {
      arr.sort(compareEventDateTime)
    }
    return m
  }, [events])

  const sheetEvents = sheetISO
    ? (eventsByDate.get(sheetISO) ?? []).slice().sort(compareEventDateTime)
    : []

  const closeSheet = () => {
    setSheetISO(null)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-8 pt-2 md:px-4">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-7 gap-px rounded-lg border border-border/50 bg-border/40 p-px">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="bg-background/95 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-foreground/45 md:text-xs"
              >
                {d}
              </div>
            ))}
            {grid.map(({ date, inMonth }) => {
              const iso = toISODate(date)
              const isToday = iso === todayISO
              const list = eventsByDate.get(iso) ?? []
              const pills = list.slice(0, 3)
              const extra = list.length - pills.length
              const sheetOpen = sheetISO === iso

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSheetISO(iso)}
                  className={`flex min-h-[100px] flex-col gap-0.5 rounded-md p-1 text-left transition-colors md:p-1.5 ${
                    sheetOpen ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
                  } ${
                    isToday
                      ? 'bg-primary/15 hover:bg-primary/20'
                      : inMonth
                        ? 'bg-background hover:bg-accent/10'
                        : 'bg-background/60 text-foreground/40 hover:bg-accent/5'
                  }`}
                >
                  <span
                    className={`text-[11px] font-semibold tabular-nums md:text-sm ${
                      isToday ? 'text-primary' : ''
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    {pills.map((ev) => (
                      <span
                        key={ev.id}
                        role="presentation"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditEvent(ev)
                        }}
                        className="flex min-w-0 cursor-pointer items-center gap-0.5 truncate rounded bg-foreground/5 px-1 py-px text-left text-[9px] font-medium hover:bg-accent/20 md:text-[10px] dark:bg-foreground/10"
                      >
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${categoryDotClass(ev.category)}`}
                        />
                        <span className="truncate">{ev.title}</span>
                      </span>
                    ))}
                    {extra > 0 ? (
                      <span onClick={(e) => e.stopPropagation()}>
                        <Popover.Root>
                          <Popover.Trigger>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 justify-start px-0.5 text-[9px] font-medium text-primary md:text-[10px]"
                            >
                              +{extra} more
                            </Button>
                          </Popover.Trigger>
                          <Popover.Content className="max-w-xs p-2">
                            <Text className="mb-2 text-xs font-medium text-foreground/70">
                              {formatDayHeading(parseISODate(iso))}
                            </Text>
                            <ul className="max-h-48 space-y-1 overflow-y-auto">
                              {list.map((ev) => (
                                <li key={ev.id}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto w-full justify-start py-1 text-left text-xs"
                                    onPress={() => onEditEvent(ev)}
                                  >
                                    <span
                                      className={`mr-1.5 size-1.5 shrink-0 rounded-full ${categoryDotClass(ev.category)}`}
                                    />
                                    <span className="truncate">
                                      {ev.startTime} {ev.title}
                                    </span>
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </Popover.Content>
                        </Popover.Root>
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {sheetISO != null ? (
        <Modal.Root key={sheetISO} state={sheetOverlay}>
          <Modal.Backdrop
            isDismissable
            className="z-[190] bg-[rgba(0,0,0,0.4)]"
          />
          <Modal.Container
            placement={compactLayout ? 'bottom' : 'center'}
            size={compactLayout ? 'lg' : 'md'}
            scroll="inside"
            className="z-[190] w-[min(100%,calc(100vw-1.5rem))] max-w-lg sm:w-auto"
          >
            <Modal.Dialog className="max-h-[85dvh] overflow-hidden border border-border/60 bg-background shadow-xl sm:max-h-[90dvh]">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <Modal.Header className="border-b border-border/50 px-4 py-3 md:px-5">
                  <Modal.Heading className="text-base font-medium tracking-tight md:text-lg">
                    {formatDayHeading(parseISODate(sheetISO))}
                  </Modal.Heading>
                </Modal.Header>
                <Modal.Body className="max-h-[50dvh] space-y-2 overflow-y-auto px-4 py-3 md:max-h-[min(24rem,55vh)] md:px-5">
                  {sheetEvents.length === 0 ? (
                    <Text className="py-2 text-sm text-foreground/55">
                      No events on this day yet.
                    </Text>
                  ) : (
                    sheetEvents.map((ev) => (
                      <Button
                        key={ev.id}
                        variant="ghost"
                        className="h-auto w-full justify-start rounded-xl border border-border/40 bg-surface/40 px-3 py-2.5 text-left hover:bg-accent/15"
                        onPress={() => {
                          onEditEvent(ev)
                          closeSheet()
                        }}
                      >
                        <div className="flex w-full min-w-0 items-center gap-2">
                          <span
                            className={`size-2 shrink-0 rounded-full ${categoryDotClass(ev.category)}`}
                          />
                          <div className="min-w-0 flex-1">
                            <Text className="block truncate text-sm font-semibold">
                              {ev.title}
                            </Text>
                            <Text className="mt-0.5 text-xs tabular-nums text-foreground/50">
                              {ev.startTime} – {ev.endTime}
                            </Text>
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </Modal.Body>
                <Modal.Footer className="flex flex-col gap-2 border-t border-border/50 px-4 py-3 sm:flex-row sm:justify-end md:px-5">
                  <Button variant="ghost" className="rounded-full" onPress={closeSheet}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    className="rounded-full"
                    onPress={() => {
                      onAddDay(sheetISO)
                      closeSheet()
                    }}
                  >
                    Add event
                  </Button>
                </Modal.Footer>
              </motion.div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Root>
      ) : null}
    </div>
  )
}
