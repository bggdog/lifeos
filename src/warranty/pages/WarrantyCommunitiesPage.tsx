import { Button, Card, Dropdown, Text } from '@heroui/react'
import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmModal } from '../components/ConfirmModal'
import { EmptyState } from '../components/EmptyState'
import { CommunityFormModal } from '../modals/CommunityFormModal'
import { useWarranty } from '../WarrantyContext'
import { openTicketCount, resolvedTicketCount } from '../utils'
import type { Community } from '../types'

export default function WarrantyCommunitiesPage() {
  const navigate = useNavigate()
  const { communities, tickets, statusConfig, upsertCommunity, deleteCommunity } =
    useWarranty()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Community | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Text className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
            Directory
          </Text>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Communities</h1>
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
          + Add community
        </Button>
      </div>

      {communities.length === 0 ? (
        <EmptyState
          title="No communities yet"
          description="Create your first community to attach homes and warranty tickets."
          actionLabel="Add community"
          onAction={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((c) => {
            const open = openTicketCount(tickets, c.id, statusConfig)
            const resolved = resolvedTicketCount(tickets, c.id, statusConfig)
            return (
              <Card.Root
                key={c.id}
                variant="default"
                className="group relative border border-border/70 bg-surface/50 shadow-none"
              >
                <Card.Content className="p-4">
                  <div className="absolute right-2 top-2">
                    <Dropdown.Root>
                      <Dropdown.Trigger
                        className="rounded-md p-1.5 text-foreground/50 opacity-0 transition-opacity hover:bg-foreground/10 group-hover:opacity-100 data-[pressed]:opacity-100"
                        aria-label="Community options"
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
                    onClick={() => navigate(`/warranty/communities/${c.id}`)}
                  >
                    <p className="pr-8 font-semibold text-foreground">{c.name}</p>
                    <p className="mt-1 text-xs text-foreground/55">{c.builder || '—'}</p>
                    <p className="mt-2 text-xs text-foreground/60">{c.address || '—'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-foreground/65">
                      <span>{c.totalHomes} homes</span>
                      <span className="text-foreground/35">·</span>
                      <span>{open} open</span>
                      <span className="text-foreground/35">·</span>
                      <span>{resolved} resolved</span>
                    </div>
                  </button>
                </Card.Content>
              </Card.Root>
            )
          })}
        </div>
      )}

      <CommunityFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editing}
        onSave={upsertCommunity}
      />

      <ConfirmModal
        open={deleteId !== null}
        title="Delete community?"
        body="This removes the community and all linked homes and tickets in this app."
        confirmLabel="Delete"
        onOpenChange={(v) => {
          if (!v) setDeleteId(null)
        }}
        onConfirm={() => {
          if (deleteId) deleteCommunity(deleteId)
          setDeleteId(null)
        }}
      />
    </div>
  )
}
