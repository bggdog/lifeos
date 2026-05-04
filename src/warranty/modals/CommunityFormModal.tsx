/* eslint-disable react-hooks/set-state-in-effect -- reset draft when modal opens */
import {
  Button,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
  useOverlayState,
} from '@heroui/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Community } from '../types'
import { newId, nowIso } from '../utils'

type Draft = {
  name: string
  builder: string
  address: string
  totalHomes: string
  notes: string
}

const empty: Draft = {
  name: '',
  builder: '',
  address: '',
  totalHomes: '',
  notes: '',
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: Community | null
  onSave: (c: Community) => void
}

export function CommunityFormModal({ open, onOpenChange, initial, onSave }: Props) {
  const state = useOverlayState({ isOpen: open, onOpenChange })
  const [draft, setDraft] = useState<Draft>(empty)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setDraft({
        name: initial.name,
        builder: initial.builder,
        address: initial.address,
        totalHomes: String(initial.totalHomes),
        notes: initial.notes,
      })
    } else {
      setDraft(empty)
    }
  }, [open, initial])

  const handleSave = () => {
    const name = draft.name.trim()
    if (!name) return
    const totalHomes = Math.max(0, Math.floor(Number(draft.totalHomes) || 0))
    const c: Community = {
      id: initial?.id ?? newId(),
      name,
      builder: draft.builder.trim(),
      address: draft.address.trim(),
      totalHomes,
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
                  {initial ? 'Edit community' : 'Add community'}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
                <TextField name="name" isRequired>
                  <Label>Name</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Community name"
                  />
                </TextField>
                <TextField name="builder">
                  <Label>Builder</Label>
                  <Input
                    value={draft.builder}
                    onChange={(e) => setDraft((d) => ({ ...d, builder: e.target.value }))}
                  />
                </TextField>
                <TextField name="address">
                  <Label>Address</Label>
                  <Input
                    value={draft.address}
                    onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                  />
                </TextField>
                <TextField name="totalHomes">
                  <Label>Total homes</Label>
                  <Input
                    inputMode="numeric"
                    value={draft.totalHomes}
                    onChange={(e) => setDraft((d) => ({ ...d, totalHomes: e.target.value }))}
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
