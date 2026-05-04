/* eslint-disable react-hooks/set-state-in-effect -- reset draft when modal opens */
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
import { useEffect, useState } from 'react'
import { CONTRACTOR_TRADES } from '../constants'
import type { Contractor } from '../types'
import { newId, nowIso } from '../utils'

type Draft = {
  name: string
  company: string
  trade: string
  phone: string
  email: string
  notes: string
}

const empty: Draft = {
  name: '',
  company: '',
  trade: 'Plumbing',
  phone: '',
  email: '',
  notes: '',
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: Contractor | null
  onSave: (c: Contractor) => void
}

export function ContractorFormModal({ open, onOpenChange, initial, onSave }: Props) {
  const state = useOverlayState({ isOpen: open, onOpenChange })
  const [draft, setDraft] = useState<Draft>(empty)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setDraft({
        name: initial.name,
        company: initial.company,
        trade: initial.trade,
        phone: initial.phone,
        email: initial.email,
        notes: initial.notes,
      })
    } else {
      setDraft(empty)
    }
  }, [open, initial])

  const handleSave = () => {
    const name = draft.name.trim()
    if (!name) return
    const c: Contractor = {
      id: initial?.id ?? newId(),
      name,
      company: draft.company.trim(),
      trade: draft.trade,
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      notes: draft.notes.trim(),
      createdAt: initial?.createdAt ?? nowIso(),
    }
    onSave(c)
    onOpenChange(false)
  }

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop
        variant="opaque"
        isDismissable
        className="z-[350] !bg-[rgba(0,0,0,0.45)] [backdrop-filter:none]"
      >
        <Modal.Container
          placement="center"
          scroll="inside"
          className="z-[350] w-full max-w-lg p-4 data-[entering]:!animate-none data-[exiting]:!animate-none"
        >
          <Modal.Dialog className="overflow-hidden rounded-2xl border border-border/60 !bg-background shadow-xl">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Modal.Header className="border-b border-border/50 px-5 py-4">
                <Modal.Heading className="text-lg font-medium tracking-tight">
                  {initial ? 'Edit contractor' : 'Add contractor'}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="max-h-[75vh] space-y-4 overflow-y-auto px-5 py-4">
                <TextField name="name" isRequired>
                  <Label>Name</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                </TextField>
                <TextField name="company">
                  <Label>Company</Label>
                  <Input
                    value={draft.company}
                    onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))}
                  />
                </TextField>
                <div className="space-y-1.5">
                  <Label className="text-sm">Trade</Label>
                  <Select.Root
                    selectedKey={draft.trade}
                    onSelectionChange={(key) =>
                      setDraft((d) => ({ ...d, trade: String(key) }))
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
                            {CONTRACTOR_TRADES.map((t) => (
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
                <TextField name="phone">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={draft.phone}
                    onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  />
                </TextField>
                <TextField name="email">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  />
                </TextField>
                <TextField name="notes">
                  <Label>Notes</Label>
                  <TextArea
                    value={draft.notes}
                    onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                    rows={3}
                    className="min-h-[88px] resize-y"
                  />
                </TextField>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2 border-t border-border/50 px-5 py-3">
                <Button variant="ghost" size="sm" onPress={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" className="rounded-full" onPress={handleSave}>
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
