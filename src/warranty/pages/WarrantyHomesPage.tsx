import { Button, Input, Label, ListBox, Select, Text } from '@heroui/react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { HomeFormModal } from '../modals/HomeFormModal'
import { useWarranty } from '../WarrantyContext'
import { isTerminalStatus } from '../utils'

export default function WarrantyHomesPage() {
  const navigate = useNavigate()
  const { homes, communities, tickets, statusConfig, upsertHome } = useWarranty()
  const [search, setSearch] = useState('')
  const [communityFilter, setCommunityFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<(typeof homes)[0] | null>(null)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return homes.filter((h) => {
      if (communityFilter !== 'all' && h.communityId !== communityFilter) return false
      if (!q) return true
      const blob = `${h.address} ${h.homeowner.name}`.toLowerCase()
      return blob.includes(q)
    })
  }, [homes, search, communityFilter])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Text className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
            Registry
          </Text>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Homes</h1>
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
          + Add home
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <TextFieldLike label="Search" className="min-w-[200px] flex-1">
          <Input
            placeholder="Address or homeowner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
          />
        </TextFieldLike>
        <div className="w-full min-w-[200px] sm:w-56">
          <Label className="mb-1.5 block text-xs font-medium text-foreground/60">
            Community
          </Label>
          <Select.Root
            selectedKey={communityFilter}
            onSelectionChange={(key) => setCommunityFilter(String(key))}
          >
            {() => (
              <>
                <Select.Trigger className="w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="w-[var(--trigger-width)]">
                  <ListBox.Root selectionMode="single" className="max-h-56 overflow-y-auto py-1">
                    <ListBox.Item id="all" textValue="All communities">
                      All communities
                    </ListBox.Item>
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
      </div>

      {homes.length === 0 ? (
        <EmptyState
          title="No homes yet"
          description="Add a home and link it to a community to track warranty tickets."
          actionLabel="Add home"
          onAction={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-border/60 md:block">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead className="border-b border-border/60 bg-surface/80 text-[11px] font-semibold uppercase tracking-wide text-foreground/50">
                <tr>
                  <th className="px-3 py-2">Lot</th>
                  <th className="px-3 py-2">Address</th>
                  <th className="px-3 py-2">Community</th>
                  <th className="px-3 py-2">Homeowner</th>
                  <th className="px-3 py-2">Closing</th>
                  <th className="px-3 py-2 text-right">Open tickets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((h) => {
                  const c = communities.find((x) => x.id === h.communityId)
                  const open = tickets.filter(
                    (t) =>
                      t.homeId === h.id && !isTerminalStatus(t.status, statusConfig),
                  ).length
                  return (
                    <tr
                      key={h.id}
                      className="cursor-pointer hover:bg-accent/25"
                      onClick={() => navigate(`/warranty/homes/${h.id}`)}
                    >
                      <td className="px-3 py-2 font-medium">{h.lotNumber || '—'}</td>
                      <td className="px-3 py-2">{h.address}</td>
                      <td className="px-3 py-2 text-foreground/70">{c?.name ?? '—'}</td>
                      <td className="px-3 py-2 text-foreground/75">{h.homeowner.name || '—'}</td>
                      <td className="px-3 py-2 text-foreground/60">{h.closingDate ?? '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{open}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 md:hidden">
            {rows.map((h) => {
              const c = communities.find((x) => x.id === h.communityId)
              const open = tickets.filter(
                (t) =>
                  t.homeId === h.id && !isTerminalStatus(t.status, statusConfig),
              ).length
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => navigate(`/warranty/homes/${h.id}`)}
                  className="w-full rounded-xl border border-border/60 bg-surface/40 p-3 text-left text-sm shadow-sm"
                >
                  <p className="font-semibold text-foreground">{h.address}</p>
                  <p className="mt-1 text-xs text-foreground/55">
                    {c?.name ?? '—'} · Lot {h.lotNumber || '—'}
                  </p>
                  <p className="mt-1 text-xs text-foreground/60">{h.homeowner.name || '—'}</p>
                  <p className="mt-2 text-xs text-foreground/50">
                    Closing {h.closingDate ?? '—'} · {open} open
                  </p>
                </button>
              )
            })}
          </div>
        </>
      )}

      <HomeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        communities={communities}
        initial={editing}
        onSave={upsertHome}
      />
    </div>
  )
}

function TextFieldLike({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-foreground/60">{label}</Label>
      {children}
    </div>
  )
}
