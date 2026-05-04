import {
  Disclosure,
  Dropdown,
  Input,
  Text,
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
import { motion } from 'framer-motion'
import {
  Check,
  ChevronRight,
  Circle,
  Flag,
  GripVertical,
  MoreHorizontal,
} from 'lucide-react'
import { useRef, useState } from 'react'
import {
  completedForSelection,
  groupAllByList,
  groupUpcomingByDate,
  tasksForSelection,
} from './selectors'
import type { Selection, Task, TaskList, TaskPriority } from './types'
import { sortTasksByOrder } from './types'

type Props = {
  lists: TaskList[]
  tasks: Task[]
  selection: Selection
  today: string
  detailOpen: boolean
  onTasksChange: (next: Task[]) => void
  onOpenDetail: (task: Task) => void
  onDuplicate: (task: Task) => void
  onDelete: (task: Task) => void
}

function priorityColor(p: TaskPriority): string {
  if (p === 'high') return 'text-red-500'
  if (p === 'medium') return 'text-amber-500'
  if (p === 'low') return 'text-blue-500'
  return 'text-transparent'
}

function isOverdue(due: string | null, t: string): boolean {
  if (!due) return false
  return due < t
}

function isDueToday(due: string | null, t: string): boolean {
  return due != null && due === t
}

function SortableTaskRow({
  task,
  lists,
  today,
  sortable,
  onToggleComplete,
  onUpdateTitle,
  onDuplicate,
  onDelete,
  onMove,
  onSetDue,
  onSetPriority,
  onOpenDetail,
}: {
  task: Task
  lists: TaskList[]
  today: string
  sortable: boolean
  onToggleComplete: () => void
  onUpdateTitle: (title: string) => void
  onDuplicate: () => void
  onDelete: () => void
  onMove: (listId: string) => void
  onSetDue: (d: string | null) => void
  onSetPriority: (p: TaskPriority) => void
  onOpenDetail: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const sort = useSortable({
    id: task.id,
    disabled: !sortable,
  })

  const style = sortable
    ? {
        transform: CSS.Transform.toString(sort.transform),
        transition: sort.transition,
      }
    : undefined

  const overdue = !task.completed && isOverdue(task.dueDate, today)
  const dueToday = !task.completed && isDueToday(task.dueDate, today)

  return (
    <motion.div
      layout
      style={style}
      ref={sortable ? sort.setNodeRef : undefined}
      className={`group relative flex items-stretch gap-1 rounded-xl border border-border/50 bg-background px-1 py-1.5 shadow-sm ${
        sort.isDragging ? 'z-20 shadow-lg ring-2 ring-primary/30' : ''
      } ${task.completed ? 'opacity-55' : ''}`}
    >
      {sortable ? (
        <button
          type="button"
          className="mt-1 touch-none self-start rounded p-1 text-foreground/30 opacity-0 hover:bg-foreground/10 hover:text-foreground/60 group-hover:opacity-100"
          aria-label="Reorder"
          {...sort.attributes}
          {...sort.listeners}
        >
          <GripVertical className="size-4" />
        </button>
      ) : (
        <span className="w-1 shrink-0" aria-hidden />
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggleComplete()
        }}
        className="mt-0.5 flex shrink-0 items-start p-1"
        aria-label={task.completed ? 'Mark incomplete' : 'Complete task'}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className={`flex size-6 items-center justify-center rounded-full border-2 ${
            task.completed
              ? 'border-primary bg-primary'
              : 'border-border bg-transparent'
          }`}
        >
          {task.completed ? (
            <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />
          ) : (
            <Circle className="size-3 text-transparent" />
          )}
        </motion.span>
      </button>

      <div
        role="button"
        tabIndex={0}
        className="min-w-0 flex-1 cursor-pointer rounded-md px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onClick={() => onOpenDetail()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpenDetail()
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          setTitleDraft(task.title)
          setEditing(true)
          queueMicrotask(() => inputRef.current?.focus())
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <Input
              ref={inputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                setEditing(false)
                onUpdateTitle(titleDraft.trim() || task.title)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  ;(e.target as HTMLInputElement).blur()
                }
                if (e.key === 'Escape') {
                  setTitleDraft(task.title)
                  setEditing(false)
                }
              }}
              className="max-w-full"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <motion.span
              layout
              className={`relative inline-block min-w-0 max-w-full text-sm font-medium ${
                task.completed ? 'text-foreground/50' : ''
              }`}
            >
              <span className="relative z-10">{task.title}</span>
              {task.completed ? (
                <motion.span
                  className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-foreground/35"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  style={{ transformOrigin: '0% 50%' }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              ) : null}
            </motion.span>
          )}
          {task.dueDate ? (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                overdue
                  ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                  : dueToday
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    : 'bg-foreground/10 text-foreground/65'
              }`}
            >
              {task.dueDate}
            </span>
          ) : null}
          {task.priority !== 'none' ? (
            <Flag
              className={`size-3.5 shrink-0 ${priorityColor(task.priority)}`}
              aria-label={`Priority ${task.priority}`}
            />
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-start pt-0.5">
        <Dropdown.Root>
          <Dropdown.Trigger
            className="rounded-md p-1 text-foreground/40 opacity-0 hover:bg-foreground/10 hover:text-foreground group-hover:opacity-100"
            aria-label="Task actions"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end" className="min-w-[12rem]">
            <Dropdown.Menu
              onAction={(key) => {
                if (key === 'edit') onOpenDetail()
                if (key === 'dup') onDuplicate()
                if (key === 'del') onDelete()
                if (key === 'dueToday') onSetDue(today)
                if (key === 'dueClear') onSetDue(null)
                if (typeof key === 'string' && key.startsWith('list:')) {
                  onMove(key.slice(5))
                }
                if (typeof key === 'string' && key.startsWith('pr:')) {
                  onSetPriority(key.slice(3) as TaskPriority)
                }
              }}
            >
              <Dropdown.Item id="edit">Edit</Dropdown.Item>
              <Dropdown.Item id="dueToday">Set due today</Dropdown.Item>
              <Dropdown.Item id="dueClear">Clear due date</Dropdown.Item>
              <Dropdown.Item id="pr:high">Priority: High</Dropdown.Item>
              <Dropdown.Item id="pr:medium">Priority: Medium</Dropdown.Item>
              <Dropdown.Item id="pr:low">Priority: Low</Dropdown.Item>
              <Dropdown.Item id="pr:none">Priority: None</Dropdown.Item>
              <Dropdown.Section aria-label="Move to list">
                {lists.map((l) => (
                  <Dropdown.Item key={l.id} id={`list:${l.id}`} textValue={l.name}>
                    Move to: {l.name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Section>
              <Dropdown.Item id="dup">Duplicate</Dropdown.Item>
              <Dropdown.Item id="del" className="text-danger">
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </div>
    </motion.div>
  )
}

export function TaskListView({
  lists,
  tasks,
  selection,
  today,
  detailOpen,
  onTasksChange,
  onOpenDetail,
  onDuplicate,
  onDelete,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const active = selection
  const open = tasksForSelection(active, tasks, today)
  const done = completedForSelection(active, tasks, today)
  const sortable = active.kind === 'list'

  const [completedOpen, setCompletedOpen] = useState(true)
  const [adding, setAdding] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const addRef = useRef<HTMLInputElement>(null)

  const reorder = (ordered: Task[]) => {
    const idSet = new Set(ordered.map((t) => t.id))
    const next = tasks.map((t) => {
      if (!idSet.has(t.id)) return t
      const idx = ordered.findIndex((x) => x.id === t.id)
      return { ...t, order: idx }
    })
    onTasksChange(next)
  }

  const onDragEnd = (e: DragEndEvent) => {
    if (!sortable) return
    const { active, over } = e
    if (!over || active.id === over.id) return
    const orderIds = open.map((t) => t.id)
    const oldI = orderIds.indexOf(String(active.id))
    const newI = orderIds.indexOf(String(over.id))
    if (oldI < 0 || newI < 0) return
    reorder(arrayMove(open, oldI, newI))
  }

  const patchTask = (id: string, patch: Partial<Task>) => {
    onTasksChange(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const toggleComplete = (task: Task) => {
    const next = !task.completed
    patchTask(task.id, {
      completed: next,
      completedAt: next ? new Date().toISOString() : null,
    })
  }

  const defaultListId = lists[0]?.id ?? ''

  const addTaskQuick = () => {
    const t = addTitle.trim()
    if (!t || !defaultListId) return
    const listId =
      active.kind === 'list' ? active.id : defaultListId
    const sameList = tasks.filter((x) => x.listId === listId)
    const maxO = sameList.reduce((m, x) => Math.max(m, x.order), -1)
    const row: Task = {
      id: crypto.randomUUID(),
      listId,
      title: t,
      notes: '',
      dueDate: null,
      priority: 'none',
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      order: maxO + 1,
      subtasks: [],
    }
    onTasksChange([...tasks, row])
    setAddTitle('')
    queueMicrotask(() => addRef.current?.focus())
  }

  const renderRows = (taskList: Task[]) => {
    const ids = taskList.map((t) => t.id)
    const rows = taskList.map((task) => (
      <SortableTaskRow
        key={task.id}
        task={task}
        lists={lists}
        today={today}
        sortable={sortable}
        onToggleComplete={() => toggleComplete(task)}
        onUpdateTitle={(title) => patchTask(task.id, { title })}
        onDuplicate={() => onDuplicate(task)}
        onDelete={() => onDelete(task)}
        onMove={(listId) => patchTask(task.id, { listId })}
        onSetDue={(d) => patchTask(task.id, { dueDate: d })}
        onSetPriority={(p) => patchTask(task.id, { priority: p })}
        onOpenDetail={() => onOpenDetail(task)}
      />
    ))

    if (!sortable) {
      return <div className="space-y-2">{rows}</div>
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">{rows}</div>
        </SortableContext>
      </DndContext>
    )
  }

  const empty = open.length === 0 && done.length === 0

  const upcomingGroups =
    active.kind === 'smart' && active.id === 'upcoming'
      ? groupUpcomingByDate(open)
      : null

  const allGroups =
    active.kind === 'smart' && active.id === 'all'
      ? groupAllByList(open, lists)
      : null

  return (
    <div
      className={`relative flex min-h-0 min-w-0 flex-1 flex-col transition-[padding] ${
        detailOpen ? 'md:pr-[320px]' : ''
      }`}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-5">
        {empty ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <Check
              className="size-12 text-foreground/15"
              strokeWidth={1.25}
            />
            <Text className="max-w-xs text-sm text-foreground/50">
              No tasks here — you&apos;re ahead of the game.
            </Text>
          </div>
        ) : upcomingGroups ? (
          <div className="space-y-6">
            {upcomingGroups.map((g) => (
              <div key={g.dateISO}>
                <div className="sticky top-0 z-10 -mx-1 mb-2 bg-background/95 px-1 py-1 text-xs font-semibold uppercase tracking-wide text-foreground/50 backdrop-blur-sm">
                  {g.dateISO}
                </div>
                {renderRows(g.tasks)}
              </div>
            ))}
          </div>
        ) : allGroups ? (
          <div className="space-y-8">
            {allGroups.map((g) => (
              <div key={g.list.id}>
                <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-center gap-2 bg-background/95 px-1 py-1 backdrop-blur-sm">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: g.list.color }}
                  />
                  <Text className="text-xs font-semibold uppercase tracking-wide text-foreground/55">
                    {g.list.name}
                  </Text>
                </div>
                {renderRows(g.tasks)}
              </div>
            ))}
          </div>
        ) : (
          renderRows(open)
        )}

        {!empty && done.length > 0 ? (
          <Disclosure.Root
            className="mt-6 border-t border-border/50 pt-3"
            defaultExpanded={completedOpen}
            onExpandedChange={setCompletedOpen}
          >
            <Disclosure.Trigger className="flex w-full items-center gap-2 rounded-lg px-1 py-2 text-left hover:bg-foreground/[0.04]">
              <Disclosure.Indicator>
                <ChevronRight className="size-4 text-foreground/45 transition-transform [[data-expanded]_&]:rotate-90" />
              </Disclosure.Indicator>
              <Text className="text-sm font-medium text-foreground/60">
                Completed ({done.length})
              </Text>
            </Disclosure.Trigger>
            <Disclosure.Content>
              <Disclosure.Body className="mt-2 space-y-2 pl-6">
                {sortTasksByOrder(done).map((task) => (
                  <SortableTaskRow
                    key={task.id}
                    task={task}
                    lists={lists}
                    today={today}
                    sortable={false}
                    onToggleComplete={() => toggleComplete(task)}
                    onUpdateTitle={(title) => patchTask(task.id, { title })}
                    onDuplicate={() => onDuplicate(task)}
                    onDelete={() => onDelete(task)}
                    onMove={(listId) => patchTask(task.id, { listId })}
                    onSetDue={(d) => patchTask(task.id, { dueDate: d })}
                    onSetPriority={(p) => patchTask(task.id, { priority: p })}
                    onOpenDetail={() => onOpenDetail(task)}
                  />
                ))}
              </Disclosure.Body>
            </Disclosure.Content>
          </Disclosure.Root>
        ) : null}

        {!empty ? (
          <div className="mt-4 border-t border-border/40 pt-3">
            {adding ? (
              <Input
                ref={addRef}
                placeholder="Task name — Enter to add"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTaskQuick()
                  if (e.key === 'Escape') {
                    setAdding(false)
                    setAddTitle('')
                  }
                }}
                onBlur={() => {
                  if (!addTitle.trim()) setAdding(false)
                }}
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAdding(true)
                  queueMicrotask(() => addRef.current?.focus())
                }}
                className="w-full rounded-lg border border-dashed border-border/60 py-2.5 text-left text-sm text-foreground/45 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground/70"
              >
                + Add task
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
