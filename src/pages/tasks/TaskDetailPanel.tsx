import {
  Button,
  Checkbox,
  CloseButton,
  Input,
  Label,
  ListBox,
  Select,
  Text,
  TextArea,
  TextField,
} from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { Task, TaskList, TaskPriority } from './types'
import { DueDatePickerField } from './DueDatePickerField'

const PRIORITIES: TaskPriority[] = ['none', 'low', 'medium', 'high']

type Props = {
  task: Task | null
  lists: TaskList[]
  isMobile: boolean
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Task>) => void
  onAddSubtask: (taskId: string, title: string) => void
  onToggleSubtask: (taskId: string, subId: string, completed: boolean) => void
}

function formatCreated(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

type FormProps = {
  task: Task
  lists: TaskList[]
  isMobile: boolean
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Task>) => void
  onAddSubtask: (taskId: string, title: string) => void
  onToggleSubtask: (taskId: string, subId: string, completed: boolean) => void
}

function TaskDetailForm({
  task,
  lists,
  isMobile,
  onClose,
  onUpdate,
  onAddSubtask,
  onToggleSubtask,
}: FormProps) {
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes)

  const flushTitle = useCallback(() => {
    const t = title.trim()
    if (t && t !== task.title) onUpdate(task.id, { title: t })
  }, [task, title, onUpdate])

  const flushNotes = useCallback(() => {
    if (notes !== task.notes) onUpdate(task.id, { notes })
  }, [task, notes, onUpdate])

  const [subDraft, setSubDraft] = useState('')

  return (
    <>
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
        <TextField name="detail-title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={flushTitle}
            className="text-xl font-semibold tracking-tight md:text-2xl"
            placeholder="Task title"
          />
        </TextField>

        <DueDatePickerField
          label="Due date"
          value={task.dueDate}
          onChange={(due) => onUpdate(task.id, { dueDate: due })}
        />

        <div className="space-y-1.5">
          <Label className="text-sm">Priority</Label>
          <Select.Root
            selectedKey={task.priority}
            onSelectionChange={(key) =>
              onUpdate(task.id, {
                priority: String(key) as TaskPriority,
              })
            }
          >
            {() => (
              <>
                <Select.Trigger className="w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="w-[var(--trigger-width)]">
                  <ListBox.Root selectionMode="single" className="py-1">
                    {PRIORITIES.map((p) => (
                      <ListBox.Item key={p} id={p} textValue={p}>
                        {p === 'none'
                          ? 'None'
                          : p.charAt(0).toUpperCase() + p.slice(1)}
                      </ListBox.Item>
                    ))}
                  </ListBox.Root>
                </Select.Popover>
              </>
            )}
          </Select.Root>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">List</Label>
          <Select.Root
            selectedKey={task.listId}
            onSelectionChange={(key) =>
              onUpdate(task.id, { listId: String(key) })
            }
          >
            {() => (
              <>
                <Select.Trigger className="w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="w-[var(--trigger-width)]">
                  <ListBox.Root selectionMode="single" className="py-1">
                    {lists.map((l) => (
                      <ListBox.Item key={l.id} id={l.id} textValue={l.name}>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: l.color }}
                          />
                          {l.name}
                        </span>
                      </ListBox.Item>
                    ))}
                  </ListBox.Root>
                </Select.Popover>
              </>
            )}
          </Select.Root>
        </div>

        <TextField name="notes">
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={flushNotes}
            placeholder="Add notes…"
            rows={5}
            className="min-h-[120px] resize-y"
          />
        </TextField>

        <div>
          <Label className="mb-2 block text-sm">Subtasks</Label>
          <ul className="space-y-2">
            {task.subtasks.map((s) => (
              <li
                key={s.id}
                className={`flex items-start gap-2 rounded-lg border border-border/40 px-2 py-1.5 ${
                  s.completed ? 'bg-foreground/[0.03] opacity-60' : ''
                }`}
              >
                <Checkbox
                  isSelected={s.completed}
                  onChange={(v) => onToggleSubtask(task.id, s.id, v)}
                  className="mt-0.5"
                />
                <span
                  className={`min-w-0 flex-1 text-sm ${
                    s.completed ? 'line-through' : ''
                  }`}
                >
                  {s.title}
                </span>
              </li>
            ))}
          </ul>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const t = subDraft.trim()
              if (!t) return
              onAddSubtask(task.id, t)
              setSubDraft('')
            }}
          >
            <Input
              value={subDraft}
              onChange={(e) => setSubDraft(e.target.value)}
              placeholder="+ Add subtask"
              className="flex-1"
            />
            <Button type="submit" size="sm" variant="primary">
              Add
            </Button>
          </form>
        </div>

        <Text className="block pt-2 text-xs text-foreground/45">
          Created {formatCreated(task.createdAt)}
        </Text>
      </div>
    </>
  )
}

export function TaskDetailPanel({
  task,
  lists,
  isMobile,
  onClose,
  onUpdate,
  onAddSubtask,
  onToggleSubtask,
}: Props) {
  if (!task) return null

  return (
    <AnimatePresence>
      <motion.aside
        key={task.id}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed inset-0 z-[200] flex w-full flex-col border-l border-border/60 bg-background shadow-xl md:absolute md:inset-y-0 md:left-auto md:right-0 md:z-[120] md:max-w-[320px]"
      >
        <TaskDetailForm
          key={task.id}
          task={task}
          lists={lists}
          isMobile={isMobile}
          onClose={onClose}
          onUpdate={onUpdate}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
        />
      </motion.aside>
    </AnimatePresence>
  )
}
