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
import { DueDatePickerField } from '../../pages/tasks/DueDatePickerField'
import type { Community, Home } from '../types'
import { newId, nowIso } from '../utils'

type Draft = {
  communityId: string
  address: string
  lotNumber: string
  homeownerName: string
  homeownerEmail: string
  homeownerPhone: string
  closingDate: string | null
  notes: string
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  communities: Community[]
  initial: Home | null
  defaultCommunityId?: string | null
  onSave: (h: Home) => void
}

export function HomeFormModal({
  open,
  onOpenChange,
  communities,
  initial,
  defaultCommunityId,
  onSave,
}: Props) {
  const state = useOverlayState({ isOpen: open, onOpenChange })
  const [draft, setDraft] = useState<Draft>({
    communityId: '',
    address: '',
    lotNumber: '',
    homeownerName: '',
    homeownerEmail: '',
    homeownerPhone: '',
    closingDate: null,
    notes: '',
  })

  useEffect(() => {
    if (!open) return
    if (initial) {
      setDraft({
        communityId: initial.communityId,
        address: initial.address,
        lotNumber: initial.lotNumber,
        homeownerName: initial.homeowner.name,
        homeownerEmail: initial.homeowner.email,
        homeownerPhone: initial.homeowner.phone,
        closingDate: initial.closingDate,
        notes: initial.notes,
      })
    } else {
      setDraft({
        communityId: defaultCommunityId ?? communities[0]?.id ?? '',
        address: '',
        lotNumber: '',
        homeownerName: '',
        homeownerEmail: '',
        homeownerPhone: '',
        closingDate: null,
        notes: '',
      })
    }
  }, [open, initial, defaultCommunityId, communities])

  const handleSave = () => {
    const address = draft.address.trim()
    if (!address || !draft.communityId) return
    const h: Home = {
      id: initial?.id ?? newId(),
      communityId: draft.communityId,
      address,
      lotNumber: draft.lotNumber.trim(),
      homeowner: {
        name: draft.homeownerName.trim(),
        email: draft.homeownerEmail.trim(),
        phone: draft.homeownerPhone.trim(),
      },
      closingDate: draft.closingDate,
      notes: draft.notes.trim(),
      createdAt: initial?.createdAt ?? nowIso(),
    }
    onSave(h)
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
                  {initial ? 'Edit home' : 'Add home'}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="max-h-[75vh] space-y-4 overflow-y-auto px-5 py-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Community</Label>
                  <Select.Root
                    selectedKey={draft.communityId || undefined}
                    onSelectionChange={(key) =>
                      setDraft((d) => ({ ...d, communityId: String(key) }))
                    }
                  >
                    {() => (
                      <>
                        <Select.Trigger className="w-full">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="w-[var(--trigger-width)]">
                          <ListBox.Root selectionMode="single" className="max-h-56 overflow-y-auto py-1">
                            {communities.map((c) => (
                              <ListBox.Item key={c.id} id={c.id} textValue={c.name}>
                                {c.name}
                              </ListBox.Item>
                            ))}
                          </ListBox.Root>
                        </Select.Popover>
                      </>
                    )}
                  </Select.Root>
                </div>
                <TextField name="address" isRequired>
                  <Label>Address</Label>
                  <Input
                    value={draft.address}
                    onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                  />
                </TextField>
                <TextField name="lot">
                  <Label>Lot number</Label>
                  <Input
                    value={draft.lotNumber}
                    onChange={(e) => setDraft((d) => ({ ...d, lotNumber: e.target.value }))}
                  />
                </TextField>
                <TextField name="hn">
                  <Label>Homeowner name</Label>
                  <Input
                    value={draft.homeownerName}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, homeownerName: e.target.value }))
                    }
                  />
                </TextField>
                <TextField name="he">
                  <Label>Homeowner email</Label>
                  <Input
                    type="email"
                    value={draft.homeownerEmail}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, homeownerEmail: e.target.value }))
                    }
                  />
                </TextField>
                <TextField name="hp">
                  <Label>Homeowner phone</Label>
                  <Input
                    type="tel"
                    value={draft.homeownerPhone}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, homeownerPhone: e.target.value }))
                    }
                  />
                </TextField>
                <DueDatePickerField
                  label="Closing date"
                  value={draft.closingDate}
                  onChange={(iso) => setDraft((d) => ({ ...d, closingDate: iso }))}
                />
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
