import { Card, Text } from '@heroui/react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWarranty } from '../WarrantyContext'
import {
  addDaysISO,
  buildActivityFeed,
  communityProgress,
  isTerminalStatus,
  openTicketCount,
  resolvedTicketCount,
  todayLocalISO,
} from '../utils'
import type { Community } from '../types'

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <Card.Root
      variant="default"
      className="border border-border/70 bg-surface/50 shadow-none"
    >
      <Card.Content className="space-y-1 px-4 py-3">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-foreground/50">
          {label}
        </Text>
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        {hint ? (
          <Text className="text-xs leading-snug text-foreground/50">{hint}</Text>
        ) : null}
      </Card.Content>
    </Card.Root>
  )
}

function BarBreakdown({
  rows,
}: {
  rows: { id: string; label: string; count: number; pct: number; color: string }[]
}) {
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="truncate text-foreground/75">{r.label}</span>
            <span className="shrink-0 tabular-nums text-foreground/60">{r.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
            <div
              className={`h-full rounded-full transition-[width] ${r.color}`}
              style={{ width: `${r.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const BAR: Record<string, string> = {
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
  teal: 'bg-teal-500',
  gray: 'bg-muted-foreground',
  green: 'bg-emerald-500',
  slate: 'bg-slate-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  orange: 'bg-orange-500',
}

export default function WarrantyDashboard() {
  const navigate = useNavigate()
  const {
    tickets,
    homes,
    communities,
    statusConfig,
  } = useWarranty()

  const today = todayLocalISO()
  const weekEnd = addDaysISO(today, 7)

  const stats = useMemo(() => {
    const open = tickets.filter((t) => !isTerminalStatus(t.status, statusConfig))
    const openCount = open.length

    const followUp = tickets.filter((t) => {
      if (isTerminalStatus(t.status, statusConfig)) return false
      return t.appointments.some((a) => {
        if (a.date < today || a.date > weekEnd) return false
        return true
      })
    }).length

    const pendingHomeowner = tickets.filter(
      (t) => t.status === 'pending-homeowner',
    ).length

    const ym = today.slice(0, 7)
    const resolvedThisMonth = tickets.filter(
      (t) => t.resolvedAt && t.resolvedAt.slice(0, 7) === ym,
    ).length

    return { openCount, followUp, pendingHomeowner, resolvedThisMonth }
  }, [tickets, statusConfig, today, weekEnd])

  const statusRows = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tickets) {
      map.set(t.status, (map.get(t.status) ?? 0) + 1)
    }
    const ordered = [...statusConfig].sort((a, b) => a.order - b.order)
    const total = tickets.length || 1
    return ordered.map((s) => ({
      id: s.id,
      label: s.label,
      count: map.get(s.id) ?? 0,
      pct: Math.round(((map.get(s.id) ?? 0) / total) * 100),
      color: BAR[s.color] ?? BAR.gray,
    }))
  }, [tickets, statusConfig])

  const activity = useMemo(
    () => buildActivityFeed(tickets, homes, 10),
    [tickets, homes],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 p-4 md:p-6">
      <header className="space-y-1">
        <Text className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
          Overview
        </Text>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Dashboard</h1>
        <Text className="text-sm text-foreground/55">
          Warranty workload at a glance — dense view for daily operations.
        </Text>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open tickets" value={stats.openCount} hint="Excludes resolved & closed" />
        <StatCard
          label="Follow-ups (7d)"
          value={stats.followUp}
          hint="Appointments in the next week"
        />
        <StatCard
          label="Pending homeowner"
          value={stats.pendingHomeowner}
          hint="Status: Pending Homeowner"
        />
        <StatCard
          label="Resolved this month"
          value={stats.resolvedThisMonth}
          hint="By resolved date"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card.Root className="border border-border/70 bg-surface/40 shadow-none">
          <Card.Content className="space-y-4 p-4">
            <Text className="text-sm font-semibold text-foreground">Tickets by status</Text>
            {tickets.length === 0 ? (
              <Text className="text-sm text-foreground/55">No tickets yet.</Text>
            ) : (
              <>
                <div className="flex h-3 overflow-hidden rounded-full bg-foreground/10">
                  {statusRows
                    .filter((r) => r.count > 0)
                    .map((r) => (
                      <div
                        key={r.id}
                        className={`h-full ${r.color}`}
                        style={{ width: `${r.pct}%` }}
                        title={`${r.label}: ${r.count}`}
                      />
                    ))}
                </div>
                <BarBreakdown rows={statusRows} />
              </>
            )}
          </Card.Content>
        </Card.Root>

        <Card.Root className="border border-border/70 bg-surface/40 shadow-none">
          <Card.Content className="space-y-3 p-4">
            <Text className="text-sm font-semibold text-foreground">Recent activity</Text>
            {activity.length === 0 ? (
              <Text className="text-sm text-foreground/55">
                Updates from tickets will appear here.
              </Text>
            ) : (
              <ul className="divide-y divide-border/60 rounded-lg border border-border/50">
                {activity.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/warranty/tickets/${a.ticketId}`)}
                      className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/30"
                    >
                      <span className="font-medium text-foreground">{a.title}</span>
                      <span className="text-xs text-foreground/55">{a.homeAddress}</span>
                      <span className="text-xs text-foreground/65">{a.summary}</span>
                      <span className="text-[11px] text-foreground/45">
                        {new Date(a.changedAt).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card.Content>
        </Card.Root>
      </div>

      <section className="space-y-3">
        <Text className="text-sm font-semibold text-foreground">Communities at a glance</Text>
        {communities.length === 0 ? (
          <Card.Root className="border border-dashed border-border/70 bg-surface/30 shadow-none">
            <Card.Content className="p-6 text-center">
              <Text className="text-sm text-foreground/60">
                Add a community to start tracking homes and tickets.
              </Text>
              <button
                type="button"
                className="mt-3 text-sm font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => navigate('/warranty/communities')}
              >
                Go to Communities
              </button>
            </Card.Content>
          </Card.Root>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((c: Community) => {
              const open = openTicketCount(tickets, c.id, statusConfig)
              const resolved = resolvedTicketCount(tickets, c.id, statusConfig)
              const pct = communityProgress(tickets, c, statusConfig)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/warranty/communities/${c.id}`)}
                  className="rounded-xl border border-border/70 bg-surface/50 p-4 text-left shadow-sm transition-shadow hover:border-primary/35 hover:shadow-md"
                >
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="mt-1 text-xs text-foreground/55">
                    {c.totalHomes} homes · {open} open · {resolved} resolved
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-emerald-500/90"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-foreground/45">
                    {pct}% resolved
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
