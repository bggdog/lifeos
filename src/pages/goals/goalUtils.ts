import { addDaysISO, toISODate } from '../tasks/types'
import type { Goal, GoalFilter } from './types'

export function todayISO(): string {
  return toISODate(new Date())
}

export function goalProgressPercent(goal: Goal): number {
  const m = goal.milestones
  if (m.length === 0) return 0
  const done = m.filter((x) => x.completed).length
  return Math.round((done / m.length) * 100)
}

export function sortMilestones(m: Goal['milestones']): Goal['milestones'] {
  return [...m].sort((a, b) => a.order - b.order)
}

export function sortGoalsByTarget(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    const at = a.targetDate
    const bt = b.targetDate
    if (!at && !bt) return a.createdAt.localeCompare(b.createdAt)
    if (!at) return 1
    if (!bt) return -1
    const c = at.localeCompare(bt)
    if (c !== 0) return c
    return a.createdAt.localeCompare(b.createdAt)
  })
}

export function filterGoals(goals: Goal[], f: GoalFilter): Goal[] {
  if (f === 'all') return goals
  if (f === 'completed')
    return goals.filter((g) => g.status === 'completed')
  return goals.filter((g) => g.status === 'inProgress')
}

export function formatTargetMonth(iso: string | null): string {
  if (!iso) return 'No target date'
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `Due ${dt.toLocaleString(undefined, { month: 'short', year: 'numeric' })}`
}

export type TargetUrgency = 'overdue' | 'soon' | 'normal'

export function targetDateUrgency(
  targetDate: string | null,
  today: string,
  status: Goal['status'],
): TargetUrgency {
  if (!targetDate || status === 'completed') return 'normal'
  if (targetDate < today) return 'overdue'
  const within = addDaysISO(today, 30)
  if (targetDate <= within) return 'soon'
  return 'normal'
}

export function formatMilestoneDate(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
