import type { Selection, Task, TaskList } from './types'
import { addDaysISO, sortTasksByOrder, toISODate } from './types'

export function tasksForSelection(
  sel: Selection,
  tasks: Task[],
  todayISO: string,
): Task[] {
  const inc = tasks.filter((t) => !t.completed)
  if (sel.kind === 'list') {
    return sortTasksByOrder(inc.filter((t) => t.listId === sel.id))
  }
  if (sel.id === 'today') {
    return sortTasksByOrder(
      inc.filter((t) => t.dueDate != null && t.dueDate === todayISO),
    )
  }
  if (sel.id === 'upcoming') {
    const end = addDaysISO(todayISO, 7)
    return sortTasksByOrder(
      inc.filter((t) => {
        if (!t.dueDate) return false
        return t.dueDate >= todayISO && t.dueDate <= end
      }),
    )
  }
  return sortTasksByOrder(inc)
}

export function completedForSelection(
  sel: Selection,
  tasks: Task[],
  todayISO: string,
): Task[] {
  const done = tasks.filter((t) => t.completed)
  if (sel.kind === 'list') {
    return sortTasksByOrder(done.filter((t) => t.listId === sel.id))
  }
  if (sel.id === 'today') {
    return sortTasksByOrder(
      done.filter((t) => t.dueDate != null && t.dueDate === todayISO),
    )
  }
  if (sel.id === 'upcoming') {
    const end = addDaysISO(todayISO, 7)
    return sortTasksByOrder(
      done.filter((t) => {
        if (!t.dueDate) return false
        return t.dueDate >= todayISO && t.dueDate <= end
      }),
    )
  }
  return sortTasksByOrder(done)
}

export type UpcomingGroup = { dateISO: string; tasks: Task[] }

export function groupUpcomingByDate(tasks: Task[]): UpcomingGroup[] {
  const map = new Map<string, Task[]>()
  for (const t of tasks) {
    if (!t.dueDate) continue
    const arr = map.get(t.dueDate) ?? []
    arr.push(t)
    map.set(t.dueDate, arr)
  }
  const keys = [...map.keys()].sort()
  return keys.map((dateISO) => ({
    dateISO,
    tasks: sortTasksByOrder(map.get(dateISO) ?? []),
  }))
}

export type ListGroup = { list: TaskList; tasks: Task[] }

export function groupAllByList(
  tasks: Task[],
  lists: TaskList[],
): ListGroup[] {
  const map = new Map<string, Task[]>()
  for (const t of tasks) {
    const arr = map.get(t.listId) ?? []
    arr.push(t)
    map.set(t.listId, arr)
  }
  return lists
    .map((list) => ({
      list,
      tasks: sortTasksByOrder(map.get(list.id) ?? []),
    }))
    .filter((g) => g.tasks.length > 0)
}

export function headerTitle(
  sel: Selection,
  lists: TaskList[],
): string {
  if (sel.kind === 'smart') {
    if (sel.id === 'today') return 'Today'
    if (sel.id === 'upcoming') return 'Upcoming'
    return 'All Tasks'
  }
  return lists.find((l) => l.id === sel.id)?.name ?? 'Tasks'
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function isOverdue(due: string | null, today: string): boolean {
  if (!due) return false
  return due < today
}

export function isDueToday(due: string | null, today: string): boolean {
  return due != null && due === today
}
