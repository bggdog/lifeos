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
import { DueDatePickerField } from '../tasks/DueDatePickerField'
import { CATEGORY_COLOR, CATEGORY_LABEL } from './categoryStyles'
import type { GoalCategory } from './types'
import { GOAL_CATEGORIES } from './types'

export type AddGoalDraft = {
  title: string
  category: GoalCategory
  targetDate: string | null
  notes: string
}

type Props = {
  onOpenChange: (open: boolean) => void
  onSave: (draft: AddGoalDraft) => void
}

export function AddGoalModal({ onOpenChange, onSave }: Props) {
  const state = useOverlayState({
    isOpen: true,
    onOpenChange,
  })

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<GoalCategory>('personal')
  const [targetDate, setTargetDate] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const reset = () => {
    setTitle('')
    setCategory('personal')
    setTargetDate(null)
    setNotes('')
  }

  const handleSave = () => {
    const t = title.trim()
    if (!t) return
    onSave({ title: t, category, targetDate, notes: notes.trim() })
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
                  Add goal
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
                <TextField name="title" isRequired>
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What do you want to achieve?"
                    autoFocus
                  />
                </TextField>

                <div className="space-y-1.5">
                  <Label className="text-sm">Category</Label>
                  <Select.Root
                    selectedKey={category}
                    onSelectionChange={(key) => {
                      if (GOAL_CATEGORIES.includes(String(key) as GoalCategory))
                        setCategory(String(key) as GoalCategory)
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
                  label="Target date (optional)"
                  value={targetDate}
                  onChange={setTargetDate}
                />

                <TextField name="notes">
                  <Label>Notes</Label>
                  <TextArea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What does success look like?"
                    rows={4}
                    className="min-h-[100px] resize-y"
                  />
                </TextField>
              </Modal.Body>
              <Modal.Footer className="border-t border-border/50 px-5 py-3">
                <div className="flex w-full justify-end gap-2">
                  <Button variant="ghost" onPress={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onPress={handleSave}>
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
