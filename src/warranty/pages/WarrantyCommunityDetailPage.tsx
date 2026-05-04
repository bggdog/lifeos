import { Button, Tabs, Text } from '@heroui/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { CommunityFormModal } from '../modals/CommunityFormModal'
import { useWarranty } from '../WarrantyContext'
import { isTerminalStatus } from '../utils'

export default function WarrantyCommunityDetailPage() {
  const { communityId } = useParams<{ communityId: string }>()
  const navigate = useNavigate()
  const { communities, homes, tickets, statusConfig, upsertCommunity } = useWarranty()
  const [editOpen, setEditOpen] = useState(false)

  const community = useMemo(
    () => communities.find((c) => c.id === communityId),
    [communities, communityId],
  )

  const communityHomes = useMemo(
    () => homes.filter((h) => h.communityId === community?.id),
    [homes, community],
  )

  const communityTickets = useMemo(
    () => tickets.filter((t) => t.communityId === community?.id),
    [tickets, community],
  )

  if (!communityId || !community) {
    return (
      <div className="p-6">
        <Text className="text-sm text-foreground/60">Community not found.</Text>
        <Button variant="ghost" className="mt-2" onPress={() => navigate('/warranty/communities')}>
          Back to communities
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border/60 bg-surface/30 px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">{community.name}</h1>
            <p className="text-sm text-foreground/60">{community.builder || '—'}</p>
            <p className="text-xs text-foreground/50">{community.address || '—'}</p>
          </div>
          <Button variant="secondary" size="sm" className="rounded-full" onPress={() => setEditOpen(true)}>
            Edit
          </Button>
        </div>
      </header>

      <Tabs.Root defaultSelectedKey="homes" className="flex min-h-0 flex-1 flex-col">
        <Tabs.ListContainer className="border-b border-border/60 px-4 md:px-6">
          <Tabs.List className="gap-0">
            <Tabs.Tab id="homes" className="px-4 py-2.5 text-sm font-medium">
              Homes
            </Tabs.Tab>
            <Tabs.Tab id="tickets" className="px-4 py-2.5 text-sm font-medium">
              Tickets
            </Tabs.Tab>
            <Tabs.Indicator />
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="homes" className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
          {communityHomes.length === 0 ? (
            <Text className="text-sm text-foreground/55">No homes in this community yet.</Text>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead className="border-b border-border/60 bg-surface/80 text-[11px] font-semibold uppercase tracking-wide text-foreground/50">
                  <tr>
                    <th className="px-3 py-2">Lot</th>
                    <th className="px-3 py-2">Address</th>
                    <th className="px-3 py-2">Homeowner</th>
                    <th className="px-3 py-2">Closing</th>
                    <th className="px-3 py-2 text-right">Open tickets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {communityHomes.map((h) => {
                    const open = tickets.filter(
                      (t) =>
                        t.homeId === h.id && !isTerminalStatus(t.status, statusConfig),
                    ).length
                    return (
                      <tr key={h.id} className="hover:bg-accent/20">
                        <td className="px-3 py-2">
                          <Link
                            to={`/warranty/homes/${h.id}`}
                            className="font-medium text-primary underline-offset-2 hover:underline"
                          >
                            {h.lotNumber || '—'}
                          </Link>
                        </td>
                        <td className="px-3 py-2">
                          <Link
                            to={`/warranty/homes/${h.id}`}
                            className="text-foreground/85 underline-offset-2 hover:underline"
                          >
                            {h.address}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-foreground/75">{h.homeowner.name || '—'}</td>
                        <td className="px-3 py-2 text-foreground/60">{h.closingDate ?? '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground/70">{open}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="tickets" className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
          {communityTickets.length === 0 ? (
            <Text className="text-sm text-foreground/55">No tickets for this community.</Text>
          ) : (
            <div className="space-y-2">
              {communityTickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate(`/warranty/tickets/${t.id}`)}
                  className="flex w-full flex-col gap-1 rounded-lg border border-border/60 bg-surface/40 px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/35 hover:bg-accent/25 md:flex-row md:items-center md:justify-between"
                >
                  <span className="font-medium text-foreground">{t.title}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge statusId={t.status} statusConfig={statusConfig} />
                    <span className="text-xs text-foreground/50">
                      {new Date(t.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Tabs.Panel>
      </Tabs.Root>

      <CommunityFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={community}
        onSave={upsertCommunity}
      />
    </div>
  )
}
