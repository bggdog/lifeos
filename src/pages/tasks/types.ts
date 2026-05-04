import type { LifeOsUser } from '../../context/UserContext'

export const TASK_LISTS_KEY = 'taskLists'
export const TASKS_KEY = 'tasks'
/** Shared across Branson + Kelsee (localStorage `shared.*`) */
export const SHARED_TASK_LISTS_KEY = 'sharedTaskLists'
export const SHARED_TASKS_KEY = 'sharedTasks'

export type TaskPriority = 'none' | 'low' | 'medium' | 'high'

export type TaskSubtask = {
  id: string
  title: string
  completed: boolean
}

export type TaskList = {
  id: string
  name: string
  color: string
  /** True when this list is stored in shared family space (both users see it). */
  shared?: boolean
  /** Who turned sharing on (only they can move the list back to private). */
  sharedOwner?: LifeOsUser
}

export type Task = {
  id: string
  listId: string
  title: string
  notes: string
  dueDate: string | null
  priority: TaskPriority
  completed: boolean
  completedAt: string | null
  createdAt: string
  order: number
  subtasks: TaskSubtask[]
}

export type SmartId = 'today' | 'upcoming' | 'all'

export type Selection =
  | { kind: 'smart'; id: SmartId }
  | { kind: 'list'; id: string }

export const DEFAULT_LIST_COLORS: Record<string, string> = {
  Work: '#7c3aed',
  Personal: '#0d9488',
}

export function selectionKey(s: Selection): string {
  return s.kind === 'smart' ? `smart:${s.id}` : `list:${s.id}`
}

export function parseSelectionKey(key: string): Selection | null {
  if (key === 'smart:today') return { kind: 'smart', id: 'today' }
  if (key === 'smart:upcoming') return { kind: 'smart', id: 'upcoming' }
  if (key === 'smart:all') return { kind: 'smart', id: 'all' }
  if (key.startsWith('list:')) return { kind: 'list', id: key.slice(5) }
  return null
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDaysISO(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  return toISODate(dt)
}

export function listIncompleteCount(
  listId: string,
  tasks: Task[],
): number {
  return tasks.filter((t) => t.listId === listId && !t.completed).length
}

export function sortTasksByOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.order - b.order)
}

export function otherHouseholdMember(user: LifeOsUser): LifeOsUser {
  return user === 'Branson' ? 'Kelsee' : 'Branson'
}
