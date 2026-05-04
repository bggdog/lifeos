import { Button, Label, ListBox, Select, Text, toast } from '@heroui/react'
import { useMemo, useState } from 'react'
import { useWarranty } from '../WarrantyContext'
import { copyTextToClipboard, isTerminalStatus } from '../utils'
import { TICKET_CATEGORIES } from '../constants'

function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c)
          if (s.includes('"') || s.includes(',') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`
          }
          return s
        })
        .join(','),
    )
    .join('\n')
}

function daysBetweenIso(a: string, b: string): number {
  return Math.max(
    0,
    Math.round((Date.parse(b) - Date.parse(a)) / (24 * 60 * 60 * 1000)),
  )
}

export default function WarrantyReportsPage() {
  const { tickets, homes, communities, contractors, statusConfig } = useWarranty()
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const last12 = useMemo(() => {
    const out: string[] = []
    const d = new Date()
    for (let i = 0; i < 12; i++) {
      const x = new Date(d.getFullYear(), d.getMonth() - i, 1)
      out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`)
    }
    return out
  }, [])

  const byCategory = useMemo(() => {
    const map = new Map<string, { total: number; open: number; resolved: number; days: number[] }>()
    const ensure = (cat: string) => {
      if (!map.has(cat)) {
        map.set(cat, { total: 0, open: 0, resolved: 0, days: [] })
      }
      return map.get(cat)!
    }
    for (const c of TICKET_CATEGORIES) ensure(c)
    for (const t of tickets) {
      const row = ensure(t.category)
      row.total += 1
      if (isTerminalStatus(t.status, statusConfig)) {
        row.resolved += 1
        if (t.resolvedAt) {
          row.days.push(daysBetweenIso(t.createdAt, t.resolvedAt))
        }
      } else {
        row.open += 1
      }
    }
    return map
  }, [tickets, statusConfig])

  const byCommunity = useMemo(() => {
    return communities.map((c) => {
      const ch = homes.filter((h) => h.communityId === c.id).length
      const tt = tickets.filter((t) => t.communityId === c.id)
      const open = tt.filter((t) => !isTerminalStatus(t.status, statusConfig)).length
      const resolved = tt.filter((t) => isTerminalStatus(t.status, statusConfig)).length
      const ratio = ch > 0 ? (tt.length / ch).toFixed(2) : '—'
      return { ...c, homes: ch, total: tt.length, open, resolved, ratio }
    })
  }, [communities, homes, tickets, statusConfig])

  const byContractor = useMemo(() => {
    return contractors.map((c) => {
      const assigned = tickets.filter((t) => t.assignedContractorId === c.id)
      const resolved = assigned.filter((t) => isTerminalStatus(t.status, statusConfig))
      const days = resolved
        .filter((t) => t.resolvedAt)
        .map((t) => daysBetweenIso(t.createdAt, t.resolvedAt!))
      const avg =
        days.length > 0
          ? (days.reduce((a, b) => a + b, 0) / days.length).toFixed(1)
          : '—'
      return {
        ...c,
        assigned: assigned.length,
        resolvedCount: resolved.length,
        avg,
      }
    })
  }, [contractors, tickets, statusConfig])

  const monthly = useMemo(() => {
    const opened = tickets.filter((t) => t.createdAt.slice(0, 7) === month).length
    const resolved = tickets.filter(
      (t) => t.resolvedAt && t.resolvedAt.slice(0, 7) === month,
    ).length
    const newHomes = homes.filter((h) => h.createdAt.slice(0, 7) === month).length
    const appts = tickets.reduce((acc, t) => {
      return (
        acc +
        t.appointments.filter((a) => a.date.slice(0, 7) === month).length
      )
    }, 0)
    const resInMonth = tickets.filter(
      (t) => t.resolvedAt && t.resolvedAt.slice(0, 7) === month && t.resolvedAt,
    )
    const avgRes =
      resInMonth.length > 0
        ? (
            resInMonth.reduce((a, t) => {
              if (!t.resolvedAt) return a
              return a + daysBetweenIso(t.createdAt, t.resolvedAt)
            }, 0) / resInMonth.length
          ).toFixed(1)
        : '—'
    return { opened, resolved, newHomes, appts, avgRes }
  }, [tickets, homes, month])

  const copySection = async (name: string, rows: (string | number)[][]) => {
    const csv = toCsv(rows)
    await copyTextToClipboard(csv)
    toast.success(`${name} copied as CSV`, { timeout: 2000 })
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-6 p-4 md:p-6"
      data-warranty-print-root
    >
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <Text className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
            Analytics
          </Text>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Reports</h1>
        </div>
        <Button variant="secondary" size="sm" className="rounded-full" onPress={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>

      <section className="rounded-xl border border-border/60 bg-surface/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Text className="text-sm font-semibold text-foreground">Tickets by category</Text>
          <Button
            variant="ghost"
            size="sm"
            className="no-print"
            onPress={() =>
              copySection('Category report', [
                ['Category', 'Total', 'Open', 'Resolved', 'Avg days to resolve'],
                ...[...byCategory.entries()].map(([cat, v]) => {
                  const avg =
                    v.days.length > 0
                      ? (v.days.reduce((a, b) => a + b, 0) / v.days.length).toFixed(1)
                      : '—'
                  return [cat, v.total, v.open, v.resolved, avg]
                }),
              ])
            }
          >
            Copy as CSV
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {[...byCategory.entries()].map(([cat, v]) => {
              const max = Math.max(1, ...[...byCategory.values()].map((x) => x.total))
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{cat}</span>
                    <span className="tabular-nums text-foreground/60">{v.total}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${(v.total / max) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="border-b border-border/60 text-[11px] uppercase text-foreground/50">
                <tr>
                  <th className="py-2 pr-2">Category</th>
                  <th className="py-2 pr-2">Total</th>
                  <th className="py-2 pr-2">Open</th>
                  <th className="py-2 pr-2">Resolved</th>
                  <th className="py-2">Avg days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {[...byCategory.entries()].map(([cat, v]) => {
                  const avg =
                    v.days.length > 0
                      ? (v.days.reduce((a, b) => a + b, 0) / v.days.length).toFixed(1)
                      : '—'
                  return (
                    <tr key={cat}>
                      <td className="py-2 pr-2 font-medium">{cat}</td>
                      <td className="py-2 pr-2 tabular-nums">{v.total}</td>
                      <td className="py-2 pr-2 tabular-nums">{v.open}</td>
                      <td className="py-2 pr-2 tabular-nums">{v.resolved}</td>
                      <td className="py-2 tabular-nums">{avg}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-surface/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Text className="text-sm font-semibold text-foreground">Tickets by community</Text>
          <Button
            variant="ghost"
            size="sm"
            className="no-print"
            onPress={() =>
              copySection('Community report', [
                ['Community', 'Homes', 'Tickets', 'Open', 'Resolved', 'Per home'],
                ...byCommunity.map((r) => [
                  r.name,
                  r.homes,
                  r.total,
                  r.open,
                  r.resolved,
                  r.ratio,
                ]),
              ])
            }
          >
            Copy as CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border/60 text-[11px] uppercase text-foreground/50">
              <tr>
                <th className="py-2 pr-2">Community</th>
                <th className="py-2 pr-2">Homes</th>
                <th className="py-2 pr-2">Tickets</th>
                <th className="py-2 pr-2">Open</th>
                <th className="py-2 pr-2">Resolved</th>
                <th className="py-2">Per home</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {byCommunity.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-2 font-medium">{r.name}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.homes}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.total}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.open}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.resolved}</td>
                  <td className="py-2 tabular-nums">{r.ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-surface/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Text className="text-sm font-semibold text-foreground">Contractor performance</Text>
          <Button
            variant="ghost"
            size="sm"
            className="no-print"
            onPress={() =>
              copySection('Contractors', [
                ['Name', 'Trade', 'Assigned', 'Resolved', 'Avg days'],
                ...byContractor.map((r) => [
                  r.name,
                  r.trade,
                  r.assigned,
                  r.resolvedCount,
                  r.avg,
                ]),
              ])
            }
          >
            Copy as CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-border/60 text-[11px] uppercase text-foreground/50">
              <tr>
                <th className="py-2 pr-2">Contractor</th>
                <th className="py-2 pr-2">Trade</th>
                <th className="py-2 pr-2">Assigned</th>
                <th className="py-2 pr-2">Resolved</th>
                <th className="py-2">Avg days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {byContractor.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-2 font-medium">{r.name}</td>
                  <td className="py-2 pr-2">{r.trade}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.assigned}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.resolvedCount}</td>
                  <td className="py-2 tabular-nums">{r.avg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-surface/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Text className="text-sm font-semibold text-foreground">Monthly summary</Text>
          <div className="flex items-center gap-2 no-print">
            <Label className="text-xs">Month</Label>
            <Select.Root selectedKey={month} onSelectionChange={(key) => setMonth(String(key))}>
              {() => (
                <>
                  <Select.Trigger className="min-w-[10rem]">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="w-[var(--trigger-width)]">
                    <ListBox.Root selectionMode="single" className="max-h-60 overflow-y-auto py-1">
                      {last12.map((m) => (
                        <ListBox.Item key={m} id={m} textValue={m}>
                          {m}
                        </ListBox.Item>
                      ))}
                    </ListBox.Root>
                  </Select.Popover>
                </>
              )}
            </Select.Root>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Opened" value={monthly.opened} />
          <Stat label="Resolved" value={monthly.resolved} />
          <Stat label="New homes" value={monthly.newHomes} />
          <Stat label="Appointments" value={monthly.appts} />
          <Stat label="Avg resolution (d)" value={monthly.avgRes} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 no-print"
          onPress={() =>
            copySection('Monthly', [
              ['Metric', 'Value'],
              ['Opened', monthly.opened],
              ['Resolved', monthly.resolved],
              ['New homes', monthly.newHomes],
              ['Appointments', monthly.appts],
              ['Avg resolution days', monthly.avgRes],
            ])
          }
        >
          Copy monthly as CSV
        </Button>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground/45">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
