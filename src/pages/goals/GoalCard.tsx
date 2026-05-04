import { Chip, ChipLabel, Dropdown, Text } from '@heroui/react'
import { motion } from 'framer-motion'
import { Check, CheckSquare, MoreHorizontal } from 'lucide-react'
import { CATEGORY_COLOR, CATEGORY_LABEL } from './categoryStyles'
import type { Goal } from './types'
import {
  formatTargetMonth,
  goalProgressPercent,
  sortMilestones,
  targetDateUrgency,
} from './goalUtils'

type Props = {
  goal: Goal
  today: string
  linkedTaskCount: number
  emphasizeEnter?: boolean
  onOpen: () => void
  onEdit: () => void
  onMarkComplete: () => void
  onRequestDelete: () => void
}

export function GoalCard({
  goal,
  today,
  linkedTaskCount,
  emphasizeEnter,
  onOpen,
  onEdit,
  onMarkComplete,
  onRequestDelete,
}: Props) {
  const pct = goalProgressPercent(goal)
  const done = goal.status === 'completed'
  const urgency = targetDateUrgency(goal.targetDate, today, goal.status)
  const dateClass =
    urgency === 'overdue'
      ? 'text-red-500'
      : urgency === 'soon'
        ? 'text-amber-600'
        : 'text-foreground/50'

  const barColor = done ? 'bg-foreground/25' : 'bg-primary'

  return (
    <motion.article
      layout
      initial={
        emphasizeEnter
          ? { opacity: 0, scale: 0.94 }
          : { opacity: 0, y: 10 }
      }
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 28,
        opacity: { duration: 0.2 },
      }}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/60 bg-background text-left shadow-sm transition-shadow hover:shadow-md ${
        done ? 'opacity-70' : ''
      }`}
      onClick={onOpen}
    >
      {done ? (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-foreground/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/80">
          Completed
        </span>
      ) : null}

      <div
        className="h-1 w-full shrink-0"
        style={{ backgroundColor: CATEGORY_COLOR[goal.category] }}
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col gap-3 p-4 pt-3">
        <div className="absolute right-2 top-2">
          <Dropdown.Root>
            <Dropdown.Trigger
              className="rounded-md p-1.5 text-foreground/45 opacity-0 hover:bg-foreground/10 hover:text-foreground/80 group-hover:opacity-100 data-[pressed]:opacity-100"
              aria-label="Goal options"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </Dropdown.Trigger>
            <Dropdown.Popover placement="bottom end" className="min-w-[10rem]">
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === 'edit') onEdit()
                  if (key === 'complete') onMarkComplete()
                  if (key === 'delete') onRequestDelete()
                }}
              >
                <Dropdown.Item id="edit">Edit</Dropdown.Item>
                {!done ? (
                  <Dropdown.Item id="complete">Mark as complete</Dropdown.Item>
                ) : null}
                <Dropdown.Item id="delete" className="text-danger">
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.Root>
        </div>

        <div className="min-w-0 pr-6">
          <h3
            className={`text-lg font-bold leading-snug tracking-tight ${
              done ? 'line-through decoration-foreground/30' : ''
            }`}
          >
            {goal.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex max-w-full shrink-0 items-center truncate rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: CATEGORY_COLOR[goal.category] }}
          >
            {CATEGORY_LABEL[goal.category]}
          </span>
          <Text className={`text-xs ${dateClass}`}>
            {formatTargetMonth(goal.targetDate)}
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
              initial={false}
              animate={{ width: `${done ? 100 : pct}%` }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            />
          </div>
          <Text className="w-10 shrink-0 text-right text-xs tabular-nums text-foreground/60">
            {pct}%
          </Text>
        </div>

        {goal.notes.trim() ? (
          <Text className="line-clamp-2 text-sm leading-relaxed text-foreground/55">
            {goal.notes.trim()}
          </Text>
        ) : null}

        {goal.milestones.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {sortMilestones(goal.milestones).map((m) => (
              <Chip
                key={m.id}
                size="sm"
                variant="secondary"
                className="max-w-[140px]"
              >
                <ChipLabel className="flex max-w-full items-center gap-1 truncate">
                  {m.completed ? (
                    <Check className="size-3 shrink-0 text-primary" aria-hidden />
                  ) : (
                    <span className="size-3 shrink-0 rounded-full border border-border" />
                  )}
                  <span className="truncate">{m.title}</span>
                </ChipLabel>
              </Chip>
            ))}
          </div>
        ) : null}

        {linkedTaskCount > 0 ? (
          <div className="mt-auto flex items-center gap-1 text-xs text-foreground/50">
            <CheckSquare className="size-3.5 shrink-0" aria-hidden />
            <span>
              {linkedTaskCount} task{linkedTaskCount === 1 ? '' : 's'} linked
            </span>
          </div>
        ) : null}
      </div>
    </motion.article>
  )
}
