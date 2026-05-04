import { Button, Input, Label, ListBox, Select } from '@heroui/react'
import { ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { priorityChipClass } from '../statusStyles'
import { TicketFormModal } from '../modals/TicketFormModal'
import { withStatusChange } from '../ticketMutations'
import { useWarranty } from '../WarrantyContext'
import { sortStatusConfig } from '../utils'
import { WarrantyKanban } from './WarrantyKanban'

type SortKey = 'title' | 'updated' | 'priority'

function toggleSet<T>(set: Set<T>, v: T): Set<T> {
  const n = new Set(set)
  if (n.has(v)) n.delete(v)
  else n.add(v)
  return n
}

function FilterChecks({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: { id: string; label: string }[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/50">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.id}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs font-medium text-foreground/80"
          >
            <input
              type="checkbox"
              checked={selected.has(o.id)}
              onChange={() => onToggle(o.id)}
              className="rounded border-border"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function WarrantyTicketsPage() {
  const navigate = useNavigate()
  const {
    tickets,
    homes,
    communities,
    contractors,
    statusConfig,
    ticketsView,
    setTicketsView,
    upsertTicket,
  } = useWarranty()

  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [statusSet, setStatusSet] = useState<Set<string>>(() => new Set())
  const [prioritySet, setPrioritySet] = useState<Set<string>>(() => new Set())
  const [categorySet, setCategorySet] = useState<Set<string>>(() => new Set())
  const [communityId, setCommunityId] = useState('all')
  const [contractorId, setContractorId] = useState('all')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('updated')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [ticketModal, setTicketModal] = useState(false)
  const [defaultStatusId, setDefaultStatusId] = useState<string | null>(null)

  const categories = useMemo(() => {
    const s = new Set<string>()
    for (const t of tickets) s.add(t.category)
    return [...s].sort()
  }, [tickets])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets.filter((t) => {
      if (statusSet.size && !statusSet.has(t.status)) return false
      if (prioritySet.size && !prioritySet.has(t.priority)) return false
      if (categorySet.size && !categorySet.has(t.category)) return false
      if (communityId !== 'all' && t.communityId !== communityId) return false
      if (contractorId !== 'all') {
        if (contractorId === 'none' && t.assignedContractorId) return false
        if (contractorId !== 'none' && t.assignedContractorId !== contractorId)
          return false
      }
      if (createdFrom && t.createdAt.slice(0, 10) < createdFrom) return false
      if (createdTo && t.createdAt.slice(0, 10) > createdTo) return false
      if (q) {
        const h = homes.find((x) => x.id === t.homeId)
        const blob = `${t.title} ${h?.address ?? ''}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [
    tickets,
    statusSet,
    prioritySet,
    categorySet,
    communityId,
    contractorId,
    createdFrom,
    createdTo,
    search,
    homes,
  ])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title) * dir
      if (sortKey === 'priority') {
        const order = { urgent: 4, high: 3, medium: 2, low: 1 } as const
        return ((order[a.priority] ?? 0) - (order[b.priority] ?? 0)) * dir
      }
      return (Date.parse(a.updatedAt) - Date.parse(b.updatedAt)) * dir
    })
  }, [filtered, sortKey, sortDir])

  const homeMap = useMemo(() => new Map(homes.map((h) => [h.id, h])), [homes])
  const commMap = useMemo(
    () => new Map(communities.map((c) => [c.id, c])),
    [communities],
  )

  const handleMove = (ticketId: string, toStatusId: string) => {
    const t = tickets.find((x) => x.id === ticketId)
    if (!t || t.status === toStatusId) return
    upsertTicket(withStatusChange(t, toStatusId, 'Moved on board', statusConfig))
  }

  const openNew = (statusId?: string) => {
    setDefaultStatusId(statusId ?? null)
    setTicketModal(true)
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'title' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Tickets</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[10rem] max-w-xs text-sm"
          />
          <div className="flex rounded-lg border border-border/60 p-0.5">
            <Button
              variant={ticketsView === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              isIconOnly
              aria-label="List view"
              className="rounded-md"
              onPress={() => setTicketsView('list')}
            >
              <List className="size-4" />
            </Button>
            <Button
              variant={ticketsView === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              isIconOnly
              aria-label="Kanban view"
              className="rounded-md"
              onPress={() => setTicketsView('kanban')}
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
          <Button variant="primary" size="sm" className="rounded-full" onPress={() => openNew()}>
            + New ticket
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-surface/30">
        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-foreground/80 md:px-4"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          Filters
          {filtersOpen ? (
            <ChevronUp className="size-4 shrink-0" />
          ) : (
            <ChevronDown className="size-4 shrink-0" />
          )}
        </button>
        {filtersOpen ? (
          <div className="space-y-4 border-t border-border/50 px-3 py-4 md:px-4">
            <FilterChecks
              label="Status"
              options={sortStatusConfig(statusConfig).map((s) => ({
                id: s.id,
                label: s.label,
              }))}
              selected={statusSet}
              onToggle={(id) => setStatusSet((s) => toggleSet(s, id))}
            />
            <FilterChecks
              label="Priority"
              options={['low', 'medium', 'high', 'urgent'].map((p) => ({
                id: p,
                label: p,
              }))}
              selected={prioritySet}
              onToggle={(id) => setPrioritySet((s) => toggleSet(s, id))}
            />
            <FilterChecks
              label="Category"
              options={categories.map((c) => ({ id: c, label: c }))}
              selected={categorySet}
              onToggle={(id) => setCategorySet((s) => toggleSet(s, id))}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Community">
                <Select.Root
                  selectedKey={communityId}
                  onSelectionChange={(key) => setCommunityId(String(key))}
                >
                  {() => (
                    <>
                      <Select.Trigger className="w-full">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="w-[var(--trigger-width)]">
                        <ListBox.Root selectionMode="single" className="max-h-52 overflow-y-auto py-1">
                          <ListBox.Item id="all" textValue="All">
                            All
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
              </Field>
              <Field label="Contractor">
                <Select.Root
                  selectedKey={contractorId}
                  onSelectionChange={(key) => setContractorId(String(key))}
                >
                  {() => (
                    <>
                      <Select.Trigger className="w-full">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="w-[var(--trigger-width)]">
                        <ListBox.Root selectionMode="single" className="max-h-52 overflow-y-auto py-1">
                          <ListBox.Item id="all" textValue="All">
                            All
                          </ListBox.Item>
                          <ListBox.Item id="none" textValue="Unassigned">
                            Unassigned
                          </ListBox.Item>
                          {contractors.map((c) => (
                            <ListBox.Item key={c.id} id={c.id} textValue={c.name}>
                              {c.name}
                            </ListBox.Item>
                          ))}
                        </ListBox.Root>
                      </Select.Popover>
                    </>
                  )}
                </Select.Root>
              </Field>
              <Field label="Created from">
                <Input
                  type="date"
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                  className="text-sm"
                />
              </Field>
              <Field label="Created to">
                <Input
                  type="date"
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                  className="text-sm"
                />
              </Field>
            </div>
          </div>
        ) : null}
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          title="No tickets"
          description="Create a ticket from a home or use New ticket."
          actionLabel="New ticket"
          onAction={() => openNew()}
        />
      ) : ticketsView === 'kanban' ? (
        <WarrantyKanban
          tickets={filtered}
          homes={homes}
          statusConfig={statusConfig}
          onMove={handleMove}
          onAddTicket={(statusId) => openNew(statusId)}
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-border/60 md:block">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead className="border-b border-border/60 bg-surface/80 text-[11px] font-semibold uppercase tracking-wide text-foreground/50">
                <tr>
                  <ThButton active={sortKey === 'title'} onClick={() => toggleSort('title')}>
                    Title
                  </ThButton>
                  <th className="px-3 py-2">Home</th>
                  <th className="px-3 py-2">Community</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Contractor</th>
                  <ThButton active={sortKey === 'updated'} onClick={() => toggleSort('updated')}>
                    Updated
                  </ThButton>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {sorted.map((t) => {
                  const h = homeMap.get(t.homeId)
                  const c = commMap.get(t.communityId)
                  const co = t.assignedContractorId
                    ? contractors.find((x) => x.id === t.assignedContractorId)
                    : null
                  return (
                    <tr
                      key={t.id}
                      className="cursor-pointer hover:bg-accent/25"
                      onClick={() => navigate(`/warranty/tickets/${t.id}`)}
                    >
                      <td className="px-3 py-2 font-medium">{t.title}</td>
                      <td className="px-3 py-2 text-foreground/75">{h?.address ?? '—'}</td>
                      <td className="px-3 py-2 text-foreground/65">{c?.name ?? '—'}</td>
                      <td className="px-3 py-2">
                        <StatusBadge statusId={t.status} statusConfig={statusConfig} />
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${priorityChipClass(t.priority)}`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-foreground/70">{t.category}</td>
                      <td className="px-3 py-2 text-foreground/65">{co?.name ?? '—'}</td>
                      <td className="px-3 py-2 text-xs text-foreground/55">
                        {new Date(t.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="space-y-2 md:hidden">
            {sorted.map((t) => {
              const h = homeMap.get(t.homeId)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate(`/warranty/tickets/${t.id}`)}
                  className="w-full rounded-xl border border-border/60 bg-surface/40 p-3 text-left text-sm"
                >
                  <p className="font-semibold text-foreground">{t.title}</p>
                  <p className="mt-1 text-xs text-foreground/55">{h?.address ?? '—'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge statusId={t.status} statusConfig={statusConfig} />
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      <TicketFormModal
        open={ticketModal}
        onOpenChange={setTicketModal}
        homes={homes}
        communities={communities}
        contractors={contractors}
        statusConfig={statusConfig}
        initial={null}
        defaultStatusId={defaultStatusId}
        onSave={upsertTicket}
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/60">{label}</Label>
      {children}
    </div>
  )
}

function ThButton({
  children,
  active,
  onClick,
}: {
  children: ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <th className="px-3 py-2">
      <button
        type="button"
        onClick={onClick}
        className={`font-semibold uppercase tracking-wide hover:text-foreground ${
          active ? 'text-foreground' : 'text-foreground/50'
        }`}
      >
        {children}
      </button>
    </th>
  )
}
