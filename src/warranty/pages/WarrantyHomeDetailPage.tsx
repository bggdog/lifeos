import { Button, Chip, ChipLabel, Text } from '@heroui/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { priorityChipClass } from '../statusStyles'
import { HomeFormModal } from '../modals/HomeFormModal'
import { TicketFormModal } from '../modals/TicketFormModal'
import { useWarranty } from '../WarrantyContext'
import { daysBetween, todayLocalISO } from '../utils'

export default function WarrantyHomeDetailPage() {
  const { homeId } = useParams<{ homeId: string }>()
  const navigate = useNavigate()
  const {
    homes,
    communities,
    tickets,
    contractors,
    statusConfig,
    upsertHome,
    upsertTicket,
  } = useWarranty()
  const [editHome, setEditHome] = useState(false)
  const [newTicket, setNewTicket] = useState(false)

  const home = useMemo(() => homes.find((h) => h.id === homeId), [homes, homeId])
  const community = useMemo(
    () => communities.find((c) => c.id === home?.communityId),
    [communities, home],
  )
  const homeTickets = useMemo(
    () => tickets.filter((t) => t.homeId === home?.id),
    [tickets, home],
  )

  if (!homeId || !home) {
    return (
      <div className="p-6">
        <Text className="text-sm text-foreground/60">Home not found.</Text>
        <Button variant="ghost" className="mt-2" onPress={() => navigate('/warranty/homes')}>
          Back to homes
        </Button>
      </div>
    )
  }

  const today = todayLocalISO()
  const daysSince =
    home.closingDate != null ? daysBetween(home.closingDate, today) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{home.address}</h1>
          <p className="text-sm text-foreground/60">
            Lot {home.lotNumber || '—'} ·{' '}
            {community ? (
              <Link
                to={`/warranty/communities/${community.id}`}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {community.name}
              </Link>
            ) : (
              '—'
            )}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full"
          onPress={() => setEditHome(true)}
        >
          Edit
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-surface/50 p-4 lg:col-span-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
            Homeowner
          </Text>
          <p className="mt-2 font-medium text-foreground">{home.homeowner.name || '—'}</p>
          <p className="mt-1 text-sm">
            {home.homeowner.email ? (
              <a
                href={`mailto:${home.homeowner.email}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                {home.homeowner.email}
              </a>
            ) : (
              '—'
            )}
          </p>
          <p className="mt-1 text-sm">
            {home.homeowner.phone ? (
              <a
                href={`tel:${home.homeowner.phone}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                {home.homeowner.phone}
              </a>
            ) : (
              '—'
            )}
          </p>
          <div className="mt-4 border-t border-border/50 pt-3 text-xs text-foreground/55">
            <p>Closing: {home.closingDate ?? '—'}</p>
            {daysSince !== null ? (
              <p className="mt-1">{daysSince} days since closing</p>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Text className="text-sm font-semibold text-foreground">Tickets</Text>
            <Button
              variant="primary"
              size="sm"
              className="rounded-full"
              onPress={() => setNewTicket(true)}
            >
              + New ticket
            </Button>
          </div>
          {homeTickets.length === 0 ? (
            <Text className="text-sm text-foreground/55">No tickets for this home.</Text>
          ) : (
            <div className="space-y-2">
              {homeTickets.map((t) => {
                const contractor = t.assignedContractorId
                  ? contractors.find((c) => c.id === t.assignedContractorId)
                  : null
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => navigate(`/warranty/tickets/${t.id}`)}
                    className="flex w-full flex-col gap-2 rounded-xl border border-border/60 bg-surface/40 px-3 py-3 text-left text-sm transition-colors hover:border-primary/35 hover:bg-accent/25 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-foreground">{t.title}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge statusId={t.status} statusConfig={statusConfig} />
                        <Chip
                          size="sm"
                          variant="secondary"
                          className={`border font-medium ${priorityChipClass(t.priority)}`}
                        >
                          <ChipLabel className="capitalize">{t.priority}</ChipLabel>
                        </Chip>
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-foreground/55 md:text-right">
                      <p>{contractor?.name ?? 'Unassigned'}</p>
                      <p className="mt-0.5">
                        Updated {new Date(t.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <HomeFormModal
        open={editHome}
        onOpenChange={setEditHome}
        communities={communities}
        initial={home}
        onSave={upsertHome}
      />

      <TicketFormModal
        open={newTicket}
        onOpenChange={setNewTicket}
        homes={homes}
        communities={communities}
        contractors={contractors}
        statusConfig={statusConfig}
        initial={null}
        defaultHomeId={home.id}
        onSave={upsertTicket}
      />
    </div>
  )
}
