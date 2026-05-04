import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  useOverlayState,
} from '@heroui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import type { TaskList, TaskPriority } from './types'
import { DueDatePickerField } from './DueDatePickerField'

export type AddTaskDraft = {
  title: string
  listId: string
  dueDate: string | null
  priority: TaskPriority
  notes: string
}

type Props = {
  onOpenChange: (open: boolean) => void
  lists: TaskList[]
  defaultListId: string
  onSave: (draft: AddTaskDraft) => void
}

const PRIORITIES: TaskPriority[] = ['none', 'low', 'medium', 'high']

export function AddTaskModal({
  onOpenChange,
  lists,
  defaultListId,
  onSave,
}: Props) {
  const state = useOverlayState({
    isOpen: true,
    onOpenChange,
  })

  const [title, setTitle] = useState('')
  const [listId, setListId] = useState(defaultListId)
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [priority, setPriority] = useState<TaskPriority>('none')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setTitle('')
    setListId(defaultListId)
    setDueDate(null)
    setPriority('none')
    setNotes('')
  }

  const handleSave = () => {
    const t = title.trim()
    if (!t) return
    onSave({ title: t, listId, dueDate, priority, notes: notes.trim() })
    reset()
    onOpenChange(false)
  }

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop
        variant="opaque"
        isDismissable
        className="z-[300] !bg-[rgba(0,0,0,0.4)] [backdrop-filter:none]"
      >
        <Modal.Container
          placement="center"
          size="md"
          scroll="inside"
          className="z-[300] flex w-full max-w-lg flex-col justify-center p-4 data-[entering]:!animate-none data-[exiting]:!animate-none"
        >
          <Modal.Dialog className="overflow-hidden rounded-2xl border border-border/60 !bg-background shadow-xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <Modal.Header className="border-b border-border/50 px-5 py-4">
                <Modal.Heading className="text-lg font-medium tracking-tight">
                  Add task
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
                <TextField name="title" isRequired>
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    autoFocus
                  />
                </TextField>

                <div className="space-y-1.5">
                  <Label className="text-sm">List</Label>
                  <Select.Root
                    selectedKey={listId}
                    onSelectionChange={(key) =>
                      setListId(String(key))
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

                <DueDatePickerField
                  label="Due date (optional)"
                  value={dueDate}
                  onChange={setDueDate}
                />

                <div className="space-y-1.5">
                  <Label className="text-sm">Priority</Label>
                  <Select.Root
                    selectedKey={priority}
                    onSelectionChange={(key) =>
                      setPriority(String(key) as TaskPriority)
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
                              <ListBox.Item
                                key={p}
                                id={p}
                                textValue={
                                  p === 'none'
                                    ? 'None'
                                    : p.charAt(0).toUpperCase() + p.slice(1)
                                }
                              >
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

                <TextField name="notes">
                  <Label>Notes (optional)</Label>
                  <TextArea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Details…"
                    rows={3}
                    className="min-h-[80px] resize-y"
                  />
                </TextField>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2 border-t border-border/50 px-5 py-3">
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onPress={() => {
                    reset()
                    onOpenChange(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="rounded-full"
                  isDisabled={!title.trim()}
                  onPress={handleSave}
                >
                  Save
                </Button>
              </Modal.Footer>
            </motion.div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  )
}
