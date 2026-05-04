import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Text,
  TextArea,
  TextField,
  useOverlayState,
} from '@heroui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import type { LifeOsUser } from '../../context/UserContext'
import type { EventCategory } from './types'
import { TIME_OPTIONS, categoryDotClass, defaultCategories, timeToMinutes } from './types'

export type EventModalMode = 'add' | 'edit'

export type EventDraft = {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  category: EventCategory
}

type Props = {
  onOpenChange: (open: boolean) => void
  mode: EventModalMode
  activeUser: LifeOsUser | null
  initialDraft: EventDraft
  editingId: string | null
  onSave: (draft: EventDraft, id: string | null) => void
  onDelete: (id: string) => void
  /** Changes when opening the modal so inner state re-initializes from `initialDraft`. */
  resetKey: number
  /** Render the overlay inside this element (schedule panel) instead of full-viewport. */
  portalContainer?: HTMLElement | null
}

function EventModalInner({
  onOpenChange,
  mode,
  activeUser,
  initialDraft,
  editingId,
  onSave,
  onDelete,
  portalContainer,
}: Omit<Props, 'resetKey'>) {
  const state = useOverlayState({ isOpen: true, onOpenChange })
  const [draft, setDraft] = useState<EventDraft>(() => ({ ...initialDraft }))
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle')

  const categories = defaultCategories(activeUser)

  const handleSave = () => {
    const t = draft.title.trim()
    if (!t) return
    const start = timeToMinutes(draft.startTime)
    const end = timeToMinutes(draft.endTime)
    if (end <= start) return
    onSave({ ...draft, title: t }, editingId)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (mode !== 'edit' || !editingId) return
    if (deleteStep === 'idle') {
      setDeleteStep('confirm')
      return
    }
    onDelete(editingId)
    setDeleteStep('idle')
    onOpenChange(false)
  }

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop
        variant="opaque"
        isDismissable
        UNSTABLE_portalContainer={portalContainer ?? undefined}
        className="!absolute inset-0 z-[1] flex !h-full !max-h-full !min-h-0 w-full min-w-0 flex-row items-center justify-center !bg-[rgba(0,0,0,0.4)] [backdrop-filter:none] [-webkit-backdrop-filter:none]"
      >
        <Modal.Container
          placement="center"
          size="md"
          scroll="inside"
          className="z-[2] flex !h-full !max-h-full !min-h-0 w-full min-w-0 max-w-full flex-col items-stretch justify-center !p-3 data-[entering]:!animate-none data-[exiting]:!animate-none sm:!p-5"
        >
          <Modal.Dialog className="mx-auto max-h-[min(32rem,85dvh)] w-full min-w-0 max-w-md overflow-hidden rounded-2xl border border-border/60 !bg-background !p-0 shadow-xl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <Modal.Header className="border-b border-border/50 px-5 py-4">
                <Modal.Heading className="text-lg font-medium tracking-tight">
                  {mode === 'add' ? 'Add event' : 'Edit event'}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="max-h-[55vh] space-y-4 overflow-y-auto px-5 py-4 sm:max-h-[min(24rem,60vh)]">
                <TextField name="title" isRequired>
                <Label>Title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  placeholder="What is happening?"
                />
              </TextField>

              <TextField name="description">
                <Label>Description</Label>
                <TextArea
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  placeholder="Optional details"
                  rows={3}
                  className="min-h-[88px] resize-y"
                />
              </TextField>

              <TextField name="date">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={draft.date}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, date: e.target.value }))
                  }
                />
              </TextField>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Start time</Label>
                  <Select.Root
                    selectedKey={draft.startTime}
                    onSelectionChange={(key) =>
                      setDraft((d) => ({
                        ...d,
                        startTime: String(key),
                      }))
                    }
                  >
                    {() => (
                      <>
                        <Select.Trigger className="w-full">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="max-h-60 w-[var(--trigger-width)]">
                          <ListBox.Root
                            selectionMode="single"
                            className="max-h-56 overflow-y-auto py-1"
                          >
                            {TIME_OPTIONS.map((t) => (
                              <ListBox.Item key={t} id={t} textValue={t}>
                                {t}
                              </ListBox.Item>
                            ))}
                          </ListBox.Root>
                        </Select.Popover>
                      </>
                    )}
                  </Select.Root>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">End time</Label>
                  <Select.Root
                    selectedKey={draft.endTime}
                    onSelectionChange={(key) =>
                      setDraft((d) => ({
                        ...d,
                        endTime: String(key),
                      }))
                    }
                  >
                    {() => (
                      <>
                        <Select.Trigger className="w-full">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="max-h-60 w-[var(--trigger-width)]">
                          <ListBox.Root
                            selectionMode="single"
                            className="max-h-56 overflow-y-auto py-1"
                          >
                            {TIME_OPTIONS.map((t) => (
                              <ListBox.Item key={t} id={t} textValue={t}>
                                {t}
                              </ListBox.Item>
                            ))}
                          </ListBox.Root>
                        </Select.Popover>
                      </>
                    )}
                  </Select.Root>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Category</Label>
                <Select.Root
                  selectedKey={draft.category}
                  onSelectionChange={(key) =>
                    setDraft((d) => ({
                      ...d,
                      category: String(key) as EventCategory,
                    }))
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
                          {categories.map((c) => (
                            <ListBox.Item key={c} id={c} textValue={c}>
                              <span className="flex items-center gap-2">
                                <span
                                  className={`size-2.5 shrink-0 rounded-full ${categoryDotClass(c)}`}
                                />
                                {c}
                              </span>
                            </ListBox.Item>
                          ))}
                        </ListBox.Root>
                      </Select.Popover>
                    </>
                  )}
                </Select.Root>
              </div>

              {deleteStep === 'confirm' ? (
                <Text className="text-sm text-red-600 dark:text-red-400">
                  Tap Delete again to remove this event.
                </Text>
              ) : null}
            </Modal.Body>
            <Modal.Footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-5 py-3">
              <div className="flex flex-wrap gap-2">
                {mode === 'edit' ? (
                  <Button
                    variant="danger"
                    onPress={handleDelete}
                    className="rounded-full"
                  >
                    {deleteStep === 'confirm' ? 'Confirm delete' : 'Delete'}
                  </Button>
                ) : (
                  <span />
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onPress={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="rounded-full"
                  onPress={handleSave}
                  isDisabled={
                    !draft.title.trim() ||
                    timeToMinutes(draft.endTime) <=
                      timeToMinutes(draft.startTime)
                  }
                >
                  Save
                </Button>
              </div>
              </Modal.Footer>
            </motion.div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  )
}

export function EventModal({
  onOpenChange,
  mode,
  activeUser,
  initialDraft,
  editingId,
  onSave,
  onDelete,
  resetKey,
  portalContainer,
}: Props) {
  return (
    <EventModalInner
      key={resetKey}
      onOpenChange={onOpenChange}
      mode={mode}
      activeUser={activeUser}
      initialDraft={initialDraft}
      editingId={editingId}
      onSave={onSave}
      onDelete={onDelete}
      portalContainer={portalContainer}
    />
  )
}
