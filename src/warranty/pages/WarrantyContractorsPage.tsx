import { Button, Card, Dropdown, Text } from '@heroui/react'
import { MoreHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmModal } from '../components/ConfirmModal'
import { EmptyState } from '../components/EmptyState'
import { ContractorFormModal } from '../modals/ContractorFormModal'
import { useWarranty } from '../WarrantyContext'
import { isTerminalStatus } from '../utils'
import type { Contractor } from '../types'

export default function WarrantyContractorsPage() {
  const navigate = useNavigate()
  const { contractors, tickets, statusConfig, upsertContractor, deleteContractor } =
    useWarranty()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Contractor | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [panelId, setPanelId] = useState<string | null>(null)

  const assignedCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of contractors) m.set(c.id, 0)
    for (const t of tickets) {
      if (t.assignedContractorId) {
        m.set(t.assignedContractorId, (m.get(t.assignedContractorId) ?? 0) + 1)
      }
    }
    return m
  }, [contractors, tickets])

  const panelContractor = contractors.find((c) => c.id === panelId)
  const panelTickets = tickets.filter((t) => t.assignedContractorId === panelId)

  return (
    <div className="flex min-h-0 flex-1 gap-4 p-4 md:p-6">
      <div className="min-h-0 min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
              Network
            </Text>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Contractors</h1>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="rounded-full"
            onPress={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            + Add contractor
          </Button>
        </div>

        {contractors.length === 0 ? (
          <EmptyState
            title="No contractors"
            description="Add trades you work with for quick assignment on tickets."
            actionLabel="Add contractor"
            onAction={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contractors.map((c) => (
              <Card.Root
                key={c.id}
                variant="default"
                className="group relative border border-border/70 bg-surface/50 shadow-none"
              >
                <Card.Content className="p-4">
                  <div className="absolute right-2 top-2">
                    <Dropdown.Root>
                      <Dropdown.Trigger
                        className="rounded-md p-1.5 text-foreground/50 opacity-0 hover:bg-foreground/10 group-hover:opacity-100 data-[pressed]:opacity-100"
                        aria-label="Options"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="size-4" />
                      </Dropdown.Trigger>
                      <Dropdown.Popover placement="bottom end" className="min-w-[10rem]">
                        <Dropdown.Menu
                          onAction={(key) => {
                            if (key === 'edit') {
                              setEditing(c)
                              setModalOpen(true)
                            }
                            if (key === 'delete') setDeleteId(c.id)
                          }}
                        >
                          <Dropdown.Item id="edit">Edit</Dropdown.Item>
                          <Dropdown.Item id="delete" className="text-danger">
                            Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown.Root>
                  </div>
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setPanelId(c.id)}
                  >
                    <p className="pr-8 font-semibold text-foreground">{c.name}</p>
                    <p className="mt-1 text-xs text-foreground/55">{c.company || '—'}</p>
                    <span className="mt-2 inline-block rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[11px] font-medium text-foreground/75">
                      {c.trade}
                    </span>
                    <div className="mt-3 space-y-0.5 text-xs text-foreground/65">
                      <p>{c.phone || '—'}</p>
                      <p>{c.email || '—'}</p>
                    </div>
                    <p className="mt-3 text-[11px] font-medium text-foreground/50">
                      {assignedCounts.get(c.id) ?? 0} tickets assigned
                    </p>
                  </button>
                </Card.Content>
              </Card.Root>
            ))}
          </div>
        )}

        <ContractorFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initial={editing}
          onSave={upsertContractor}
        />

        <ConfirmModal
          open={deleteId !== null}
          title="Delete contractor?"
          body="Unassigns this contractor from tickets and removes their card."
          onOpenChange={(v) => {
            if (!v) setDeleteId(null)
          }}
          onConfirm={() => {
            if (deleteId) deleteContractor(deleteId)
            setDeleteId(null)
            setPanelId(null)
          }}
        />
      </div>

      {panelContractor ? (
        <aside className="hidden w-80 shrink-0 rounded-xl border border-border/60 bg-surface/40 p-4 lg:block">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground">{panelContractor.name}</p>
              <p className="text-xs text-foreground/55">{panelContractor.company}</p>
            </div>
            <Button variant="ghost" size="sm" onPress={() => setPanelId(null)}>
              Close
            </Button>
          </div>
          <p className="text-xs text-foreground/65">{panelContractor.trade}</p>
          <p className="mt-2 text-sm">{panelContractor.phone}</p>
          <p className="text-sm">{panelContractor.email}</p>
          <p className="mt-3 text-xs text-foreground/60">{panelContractor.notes}</p>
          <Text className="mt-4 text-xs font-semibold uppercase text-foreground/45">
            Assigned tickets
          </Text>
          <ul className="mt-2 max-h-[50vh] space-y-1 overflow-y-auto text-sm">
            {panelTickets.length === 0 ? (
              <li className="text-foreground/55">None</li>
            ) : (
              panelTickets.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1.5 text-left hover:bg-accent/30"
                    onClick={() => navigate(`/warranty/tickets/${t.id}`)}
                  >
                    <span className="line-clamp-1 font-medium text-foreground">{t.title}</span>
                    <span className="text-[11px] text-foreground/50">
                      {isTerminalStatus(t.status, statusConfig) ? 'Closed' : 'Open'}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>
      ) : null}
    </div>
  )
}
