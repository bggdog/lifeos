import {
  Button,
  Checkbox,
  CloseButton,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  Text,
  TextArea,
  TextField,
} from '@heroui/react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, GripVertical, Link2, Trash2, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import type { Task } from '../tasks/types'
import { DueDatePickerField } from '../tasks/DueDatePickerField'
import { CATEGORY_COLOR, CATEGORY_LABEL } from './categoryStyles'
import { formatMilestoneDate, sortMilestones } from './goalUtils'
import type { Goal, GoalCategory, GoalMilestone } from './types'
import { GOAL_CATEGORIES } from './types'

type Props = {
  goal: Goal | null
  tasks: Task[]
  isMobile: boolean
  onClose: () => void
  onUpdateGoal: (id: string, patch: Partial<Goal>) => void
  onPersistTasks: (next: Task[]) => void
}

function SortableMilestoneRow({
  milestone,
  onToggle,
  onTitleCommit,
  onDateChange,
  onRemove,
}: {
  milestone: GoalMilestone
  onToggle: (completed: boolean) => void
  onTitleCommit: (title: string) => void
  onDateChange: (iso: string | null) => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(milestone.title)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-2 rounded-xl border border-border/50 bg-surface/20 px-2 py-2 ${
        isDragging ? 'z-10 shadow-lg ring-2 ring-primary/20' : ''
      }`}
    >
      <button
        type="button"
        className="mt-1 touch-none rounded p-0.5 text-foreground/35 opacity-0 hover:bg-foreground/10 group-hover:opacity-100"
        aria-label="Reorder milestone"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <motion.div
        className="pt-0.5"
        animate={
          milestone.completed
            ? { scale: [1, 1.18, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <Checkbox
          isSelected={milestone.completed}
          onChange={onToggle}
          className="shrink-0"
        />
      </motion.div>
      <div className="min-w-0 flex-1 space-y-1">
        {editing ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              setEditing(false)
              onTitleCommit(draft.trim() || milestone.title)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') {
                setDraft(milestone.title)
                setEditing(false)
              }
            }}
            autoFocus
            className="text-sm"
          />
        ) : (
          <button
            type="button"
            className={`w-full rounded px-0.5 text-left text-sm font-medium ${
              milestone.completed
                ? 'text-foreground/45 line-through'
                : 'text-foreground'
            }`}
            onClick={() => {
              setDraft(milestone.title)
              setEditing(true)
            }}
          >
            {milestone.title}
          </button>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={milestone.targetDate ?? ''}
            onChange={(e) =>
              onDateChange(
                e.target.value === '' ? null : e.target.value,
              )
            }
            className="max-w-[11rem] text-xs"
            aria-label="Milestone target date (optional)"
          />
          {milestone.targetDate ? (
            <Text className="text-[11px] text-foreground/45">
              {formatMilestoneDate(milestone.targetDate)}
            </Text>
          ) : null}
        </div>
      </div>
      <Button
        variant="ghost"
        isIconOnly
        size="sm"
        className="shrink-0 opacity-0 hover:!opacity-100 group-hover:opacity-60"
        aria-label="Remove milestone"
        onPress={onRemove}
      >
        <Trash2 className="size-4 text-danger" />
      </Button>
    </div>
  )
}

function LinkedTasksBlock({
  goal,
  tasks,
  query,
  setQuery,
  onLink,
  onUnlink,
  onToggleTask,
}: {
  goal: Goal
  tasks: Task[]
  query: string
  setQuery: (q: string) => void
  onLink: (taskId: string) => void
  onUnlink: (taskId: string) => void
  onToggleTask: (taskId: string, completed: boolean) => void
}) {
  const linked = useMemo(
    () =>
      goal.linkedTaskIds
        .map((id) => tasks.find((t) => t.id === id))
        .filter((t): t is Task => t != null),
    [goal.linkedTaskIds, tasks],
  )

  const q = query.trim().toLowerCase()
  const candidates = useMemo(() => {
    if (q.length < 1) return []
    const linkedSet = new Set(goal.linkedTaskIds)
    return tasks
      .filter(
        (t) =>
          !linkedSet.has(t.id) &&
          t.title.toLowerCase().includes(q),
      )
      .slice(0, 10)
  }, [tasks, goal.linkedTaskIds, q])

  const allLinkedDone =
    linked.length > 0 && linked.every((t) => t.completed)

  return (
    <div className="space-y-3 border-t border-border/40 pt-4">
      <Text className="text-sm font-semibold tracking-tight">Linked Tasks</Text>
      <TextField name="link-search">
        <Label className="text-xs text-foreground/60">Search tasks by title</Label>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to find a task…"
          className="mt-1"
        />
      </TextField>
      {candidates.length > 0 ? (
        <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border/40 p-1">
          {candidates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-foreground/[0.06]"
                onClick={() => {
                  onLink(t.id)
                  setQuery('')
                }}
              >
                <Link2 className="size-3.5 shrink-0 text-foreground/40" />
                <span className="truncate">{t.title}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="space-y-2">
        {linked.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-2 rounded-lg border border-border/40 px-2 py-1.5"
          >
            <Checkbox
              isSelected={t.completed}
              onChange={(v) => onToggleTask(t.id, v)}
            />
            <span
              className={`min-w-0 flex-1 truncate text-sm ${
                t.completed ? 'text-foreground/45 line-through' : ''
              }`}
            >
              {t.title}
            </span>
            <Button
              variant="ghost"
              isIconOnly
              size="sm"
              aria-label="Unlink task"
              className="shrink-0"
              onPress={() => onUnlink(t.id)}
            >
              <X className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      {allLinkedDone ? (
        <Text className="text-center text-xs text-foreground/50">
          All tasks done 🎉
        </Text>
      ) : null}
    </div>
  )
}

function GoalDetailForm({
  goal,
  tasks,
  isMobile,
  onClose,
  onUpdateGoal,
  onPersistTasks,
}: Omit<Props, 'goal'> & { goal: Goal }) {
  const [title, setTitle] = useState(goal.title)
  const [notes, setNotes] = useState(goal.notes)
  const [linkQuery, setLinkQuery] = useState('')
  const [milestoneDraft, setMilestoneDraft] = useState('')

  const flushTitle = useCallback(() => {
    const t = title.trim()
    if (t && t !== goal.title) onUpdateGoal(goal.id, { title: t })
  }, [goal, title, onUpdateGoal])

  const flushNotes = useCallback(() => {
    if (notes !== goal.notes) onUpdateGoal(goal.id, { notes })
  }, [goal, notes, onUpdateGoal])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const ordered = sortMilestones(goal.milestones)
  const ids = ordered.map((m) => m.id)

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(ordered, oldIndex, newIndex).map((m, i) => ({
      ...m,
      order: i,
    }))
    onUpdateGoal(goal.id, { milestones: next })
  }

  const patchMilestone = (
    mid: string,
    patch: Partial<GoalMilestone>,
  ) => {
    const next = goal.milestones.map((m) =>
      m.id === mid ? { ...m, ...patch } : m,
    )
    onUpdateGoal(goal.id, { milestones: next })
  }

  const addMilestone = () => {
    const t = milestoneDraft.trim()
    if (!t) return
    const maxO = goal.milestones.reduce((m, x) => Math.max(m, x.order), -1)
    onUpdateGoal(goal.id, {
      milestones: [
        ...goal.milestones,
        {
          id: crypto.randomUUID(),
          title: t,
          completed: false,
          targetDate: null,
          order: maxO + 1,
        },
      ],
    })
    setMilestoneDraft('')
  }

  return (
    <motion.aside
      key={goal.id}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[200] flex w-full flex-col border-l border-border/60 bg-background shadow-xl md:absolute md:inset-y-0 md:left-auto md:right-0 md:z-[120] md:max-w-[360px]"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
        {isMobile ? (
          <Button
            variant="ghost"
            isIconOnly
            aria-label="Back"
            onPress={onClose}
          >
            <ArrowLeft className="size-5" />
          </Button>
        ) : (
          <span className="w-10" aria-hidden />
        )}
        {!isMobile ? (
          <CloseButton
            aria-label="Close"
            className="shrink-0 rounded-full"
            onPress={onClose}
          />
        ) : (
          <span className="w-10" aria-hidden />
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <TextField name="goal-title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={flushTitle}
            className="text-2xl font-semibold tracking-tight md:text-3xl"
            placeholder="Goal title"
          />
        </TextField>

        <div className="space-y-1.5">
          <Label className="text-sm">Category</Label>
          <Select.Root
            selectedKey={goal.category}
            onSelectionChange={(key) => {
              if (GOAL_CATEGORIES.includes(String(key) as GoalCategory))
                onUpdateGoal(goal.id, {
                  category: String(key) as GoalCategory,
                })
            }}
          >
            {() => (
              <>
                <Select.Trigger className="w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="w-[var(--trigger-width)]">
                  <ListBox.Root selectionMode="single" className="py-1">
                    {GOAL_CATEGORIES.map((c) => (
                      <ListBox.Item key={c} id={c} textValue={CATEGORY_LABEL[c]}>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLOR[c] }}
                          />
                          {CATEGORY_LABEL[c]}
                        </span>
                      </ListBox.Item>
                    ))}
                  </ListBox.Root>
                </Select.Popover>
              </>
            )}
          </Select.Root>
        </div>

        <DueDatePickerField
          label="Target date"
          value={goal.targetDate}
          onChange={(d) => onUpdateGoal(goal.id, { targetDate: d })}
        />

        <TextField name="goal-notes">
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={flushNotes}
            placeholder="What does success look like?"
            rows={4}
            className="min-h-[100px] resize-y"
          />
        </TextField>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-3 py-2">
          <div>
            <Text className="text-sm font-medium">Status</Text>
            <Text className="text-xs text-foreground/50">
              {goal.status === 'completed' ? 'Completed' : 'In progress'}
            </Text>
          </div>
          <Switch.Root
            isSelected={goal.status === 'completed'}
            onChange={(v) =>
              onUpdateGoal(goal.id, {
                status: v ? 'completed' : 'inProgress',
                completedAt: v ? new Date().toISOString() : null,
              })
            }
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </div>

        <div>
          <Text className="mb-2 text-sm font-semibold tracking-tight">
            Milestones
          </Text>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {ordered.map((m) => (
                  <SortableMilestoneRow
                    key={m.id}
                    milestone={m}
                    onToggle={(completed) =>
                      patchMilestone(m.id, { completed })
                    }
                    onTitleCommit={(nextTitle) =>
                      patchMilestone(m.id, { title: nextTitle })
                    }
                    onDateChange={(iso) =>
                      patchMilestone(m.id, { targetDate: iso })
                    }
                    onRemove={() =>
                      onUpdateGoal(goal.id, {
                        milestones: goal.milestones.filter((x) => x.id !== m.id),
                      })
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              addMilestone()
            }}
          >
            <Input
              value={milestoneDraft}
              onChange={(e) => setMilestoneDraft(e.target.value)}
              placeholder="+ Add milestone — Enter"
              className="flex-1"
            />
            <Button type="submit" variant="primary" size="sm">
              Add
            </Button>
          </form>
        </div>

        <LinkedTasksBlock
          goal={goal}
          tasks={tasks}
          query={linkQuery}
          setQuery={setLinkQuery}
          onLink={(taskId) =>
            onUpdateGoal(goal.id, {
              linkedTaskIds: [...goal.linkedTaskIds, taskId],
            })
          }
          onUnlink={(taskId) =>
            onUpdateGoal(goal.id, {
              linkedTaskIds: goal.linkedTaskIds.filter((id) => id !== taskId),
            })
          }
          onToggleTask={(taskId, completed) => {
            const next = tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    completed,
                    completedAt: completed ? new Date().toISOString() : null,
                  }
                : t,
            )
            onPersistTasks(next)
          }}
        />
      </div>
    </motion.aside>
  )
}

export function GoalDetailPanel({
  goal,
  tasks,
  isMobile,
  onClose,
  onUpdateGoal,
  onPersistTasks,
}: Props) {
  return (
    <AnimatePresence mode="wait">
      {goal ? (
        <GoalDetailForm
          key={goal.id}
          goal={goal}
          tasks={tasks}
          isMobile={isMobile}
          onClose={onClose}
          onUpdateGoal={onUpdateGoal}
          onPersistTasks={onPersistTasks}
        />
      ) : null}
    </AnimatePresence>
  )
}
