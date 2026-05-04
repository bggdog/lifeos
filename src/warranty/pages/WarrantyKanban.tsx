import { Text } from '@heroui/react'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { priorityChipClass } from '../statusStyles'
import type { StatusConfigItem, Ticket } from '../types'
import { sortStatusConfig } from '../utils'

function Column({
  status,
  count,
  children,
}: {
  status: StatusConfigItem
  count: number
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status.id}` })
  return (
    <div
      ref={setNodeRef}
      className={`flex w-[min(280px,85vw)] shrink-0 flex-col rounded-xl border bg-surface/40 ${
        isOver ? 'border-primary/50 ring-2 ring-primary/20' : 'border-border/60'
      }`}
    >
      <div className="border-b border-border/50 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <Text className="text-xs font-semibold uppercase tracking-wide text-foreground/55">
            {status.label}
          </Text>
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground/70">
            {count}
          </span>
        </div>
      </div>
      <div className="max-h-[calc(100dvh-14rem)] min-h-[12rem] space-y-2 overflow-y-auto p-2">
        {children}
      </div>
    </div>
  )
}

function KanbanCard({
  ticket,
  homeAddress,
  upcoming,
}: {
  ticket: Ticket
  homeAddress: string
  upcoming: string | null
}) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.55 : 1,
  }
  const initial = ticket.assignedContractorId?.slice(0, 1).toUpperCase() ?? '?'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-1 rounded-lg border border-border/60 bg-background px-1.5 py-2 text-left text-xs shadow-sm"
    >
      <button
        type="button"
        className="mt-0.5 shrink-0 cursor-grab rounded p-0.5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground/70 active:cursor-grabbing"
        aria-label="Drag ticket"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => navigate(`/warranty/tickets/${ticket.id}`)}
      >
        <p className="line-clamp-2 font-medium text-foreground">{ticket.title}</p>
        <p className="mt-1 line-clamp-1 text-[11px] text-foreground/55">{homeAddress}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${priorityChipClass(ticket.priority)}`}
          >
            {ticket.priority}
          </span>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
            {initial}
          </span>
        </div>
        {upcoming ? (
          <p className="mt-1.5 text-[10px] font-medium text-teal-700 dark:text-teal-300">
            {upcoming}
          </p>
        ) : null}
      </button>
    </div>
  )
}

export function WarrantyKanban({
  tickets,
  homes,
  statusConfig,
  onMove,
  onAddTicket,
}: {
  tickets: Ticket[]
  homes: { id: string; address: string }[]
  statusConfig: StatusConfigItem[]
  onMove: (ticketId: string, toStatusId: string) => void
  onAddTicket: (defaultStatusId: string) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const byStatus = useMemo(() => {
    const m = new Map<string, Ticket[]>()
    for (const s of statusConfig) m.set(s.id, [])
    for (const t of tickets) {
      const arr = m.get(t.status)
      if (arr) arr.push(t)
      else m.get(statusConfig[0]?.id ?? '')?.push(t)
    }
    return m
  }, [tickets, statusConfig])

  const homeMap = useMemo(() => new Map(homes.map((h) => [h.id, h])), [homes])
  const today = new Date().toISOString().slice(0, 10)

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over) return
    const overId = String(over.id)
    if (!overId.startsWith('col-')) return
    const col = overId.slice(4)
    onMove(String(active.id), col)
  }

  const ordered = sortStatusConfig(statusConfig)

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {ordered.map((s) => {
          const list = byStatus.get(s.id) ?? []
          return (
            <Column key={s.id} status={s} count={list.length}>
              {list.map((t) => {
                const h = homeMap.get(t.homeId)
                const addr = h?.address ?? '—'
                const upcoming = [...t.appointments]
                  .filter((a) => a.date >= today)
                  .sort((a, b) => a.date.localeCompare(b.date))[0]
                return (
                  <KanbanCard
                    key={t.id}
                    ticket={t}
                    homeAddress={addr}
                    upcoming={
                      upcoming ? `Appt ${upcoming.date} ${upcoming.time}` : null
                    }
                  />
                )
              })}
              <button
                type="button"
                className="w-full rounded-lg border border-dashed border-border/70 py-2 text-[11px] font-medium text-foreground/50 transition-colors hover:border-primary/40 hover:text-primary"
                onClick={() => onAddTicket(s.id)}
              >
                + Add ticket
              </button>
            </Column>
          )
        })}
      </div>
    </DndContext>
  )
}
