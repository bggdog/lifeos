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
import { useEffect, useMemo, useState } from 'react'
import { TICKET_CATEGORIES } from '../constants'
import { withStatusChange } from '../ticketMutations'
import type { Contractor, Home, StatusConfigItem, Ticket } from '../types'
import { newId, nowIso, sortStatusConfig } from '../utils'

type Draft = {
  title: string
  homeId: string
  category: string
  priority: Ticket['priority']
  status: string
  description: string
  assignedContractorId: string | null
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  homes: Home[]
  communities: { id: string; name: string }[]
  contractors: Contractor[]
  statusConfig: StatusConfigItem[]
  initial: Ticket | null
  defaultHomeId?: string | null
  /** When creating a ticket, pre-select status (e.g. from Kanban column). */
  defaultStatusId?: string | null
  onSave: (t: Ticket) => void
}

function homeLabel(h: Home, communities: { id: string; name: string }[]) {
  const c = communities.find((x) => x.id === h.communityId)
  return `${h.address}${c ? ` · ${c.name}` : ''}`
}

function emptyTicket(
  homeId: string,
  communityId: string,
  status: string,
): Ticket {
  const ts = nowIso()
  return {
    id: newId(),
    homeId,
    communityId,
    title: '',
    description: '',
    status,
    customStatuses: [],
    priority: 'medium',
    category: 'Plumbing',
    assignedContractorId: null,
    appointments: [],
    statusHistory: [],
    communications: [],
    attachments: [],
    createdAt: ts,
    updatedAt: ts,
    resolvedAt: null,
  }
}

export function TicketFormModal({
  open,
  onOpenChange,
  homes,
  communities,
  contractors,
  statusConfig,
  initial,
  defaultHomeId,
  defaultStatusId,
  onSave,
}: Props) {
  const state = useOverlayState({ isOpen: open, onOpenChange })
  const [homeSearch, setHomeSearch] = useState('')
  const [draft, setDraft] = useState<Draft>({
    title: '',
    homeId: '',
    category: 'Plumbing',
    priority: 'medium',
    status: 'new',
    description: '',
    assignedContractorId: null,
  })

  useEffect(() => {
    if (!open) return
    setHomeSearch('')
    if (initial) {
      setDraft({
        title: initial.title,
        homeId: initial.homeId,
        category: initial.category,
        priority: initial.priority,
        status: initial.status,
        description: initial.description,
        assignedContractorId: initial.assignedContractorId,
      })
    } else {
      const hid = defaultHomeId ?? homes[0]?.id ?? ''
      setDraft({
        title: '',
        homeId: hid,
        category: 'Plumbing',
        priority: 'medium',
        status:
          defaultStatusId &&
          statusConfig.some((s) => s.id === defaultStatusId)
            ? defaultStatusId
            : (sortStatusConfig(statusConfig)[0]?.id ?? 'new'),
        description: '',
        assignedContractorId: null,
      })
    }
  }, [open, initial, defaultHomeId, defaultStatusId, homes, statusConfig])

  const filteredHomes = useMemo(() => {
    const q = homeSearch.trim().toLowerCase()
    if (!q) return homes
    return homes.filter((h) => {
      const c = communities.find((x) => x.id === h.communityId)
      const blob = `${h.address} ${h.homeowner.name} ${c?.name ?? ''}`.toLowerCase()
      return blob.includes(q)
    })
  }, [homes, homeSearch, communities])

  const handleSave = () => {
    const title = draft.title.trim()
    if (!title || !draft.homeId) return
    const home = homes.find((h) => h.id === draft.homeId)
    if (!home) return

    if (initial) {
      let next: Ticket = {
        ...initial,
        title,
        homeId: draft.homeId,
        communityId: home.communityId,
        category: draft.category,
        priority: draft.priority,
        description: draft.description,
        assignedContractorId: draft.assignedContractorId,
        updatedAt: nowIso(),
      }
      if (draft.status !== initial.status) {
        next = withStatusChange(next, draft.status, 'Status updated', statusConfig)
      } else {
        next = { ...next, status: draft.status }
      }
      onSave(next)
    } else {
      const ts = nowIso()
      const base = emptyTicket(draft.homeId, home.communityId, draft.status)
      const t: Ticket = {
        ...base,
        title,
        category: draft.category,
        priority: draft.priority,
        description: draft.description,
        assignedContractorId: draft.assignedContractorId,
        statusHistory: [
          {
            id: newId(),
            fromStatus: null,
            toStatus: draft.status,
            note: 'Ticket created',
            changedAt: ts,
          },
        ],
      }
      onSave(t)
    }
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
                  {initial ? 'Edit ticket' : 'New ticket'}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="max-h-[75vh] space-y-4 overflow-y-auto px-5 py-4">
                <TextField name="title" isRequired>
                  <Label>Title</Label>
                  <Input
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  />
                </TextField>

                <div className="space-y-1.5">
                  <Label className="text-sm">Home</Label>
                  <Input
                    placeholder="Search address or homeowner…"
                    value={homeSearch}
                    onChange={(e) => setHomeSearch(e.target.value)}
                    className="text-sm"
                  />
                  <Select.Root
                    selectedKey={draft.homeId || undefined}
                    onSelectionChange={(key) =>
                      setDraft((d) => ({ ...d, homeId: String(key) }))
                    }
                  >
                    {() => (
                      <>
                        <Select.Trigger className="w-full">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover className="w-[var(--trigger-width)]">
                          <ListBox.Root selectionMode="single" className="max-h-52 overflow-y-auto py-1">
                            {filteredHomes.map((h) => (
                              <ListBox.Item
                                key={h.id}
                                id={h.id}
                                textValue={homeLabel(h, communities)}
                              >
                                {homeLabel(h, communities)}
                              </ListBox.Item>
                            ))}
                          </ListBox.Root>
                        </Select.Popover>
                      </>
                    )}
                  </Select.Root>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Category</Label>
                    <Select.Root
                      selectedKey={draft.category}
                      onSelectionChange={(key) =>
                        setDraft((d) => ({ ...d, category: String(key) }))
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
                              {TICKET_CATEGORIES.map((c) => (
                                <ListBox.Item key={c} id={c} textValue={c}>
                                  {c}
                                </ListBox.Item>
                              ))}
                            </ListBox.Root>
                          </Select.Popover>
                        </>
                      )}
                    </Select.Root>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Priority</Label>
                    <Select.Root
                      selectedKey={draft.priority}
                      onSelectionChange={(key) =>
                        setDraft((d) => ({
                          ...d,
                          priority: String(key) as Ticket['priority'],
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
                              {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                                <ListBox.Item key={p} id={p} textValue={p}>
                                  {p}
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
                  <Label className="text-sm">Status</Label>
                  <Select.Root
                    selectedKey={draft.status}
                    onSelectionChange={(key) =>
                      setDraft((d) => ({ ...d, status: String(key) }))
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
                            {sortStatusConfig(statusConfig).map((s) => (
                              <ListBox.Item key={s.id} id={s.id} textValue={s.label}>
                                {s.label}
                              </ListBox.Item>
                            ))}
                          </ListBox.Root>
                        </Select.Popover>
                      </>
                    )}
                  </Select.Root>
                </div>

                <TextField name="desc">
                  <Label>Description</Label>
                  <TextArea
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, description: e.target.value }))
                    }
                    rows={4}
                    className="min-h-[100px] resize-y"
                  />
                </TextField>

                <div className="space-y-1.5">
                  <Label className="text-sm">Assigned contractor</Label>
                  <Select.Root
                    selectedKey={draft.assignedContractorId ?? 'none'}
                    onSelectionChange={(key) =>
                      setDraft((d) => ({
                        ...d,
                        assignedContractorId: key === 'none' ? null : String(key),
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
                          <ListBox.Root selectionMode="single" className="max-h-52 overflow-y-auto py-1">
                            <ListBox.Item id="none" textValue="None">
                              None
                            </ListBox.Item>
                            {contractors.map((c) => (
                              <ListBox.Item key={c.id} id={c.id} textValue={c.name}>
                                {c.name} — {c.trade}
                              </ListBox.Item>
                            ))}
                          </ListBox.Root>
                        </Select.Popover>
                      </>
                    )}
                  </Select.Root>
                </div>
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
