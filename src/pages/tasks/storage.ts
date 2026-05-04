import type { LifeOsUser } from '../../context/UserContext'
import { getSharedData, getUserData, setSharedData, setUserData } from '../../lib/storage'
import type { Task, TaskList } from './types'
import {
  DEFAULT_LIST_COLORS,
  SHARED_TASK_LISTS_KEY,
  SHARED_TASKS_KEY,
  TASK_LISTS_KEY,
  TASKS_KEY,
} from './types'

function isTaskList(x: unknown): x is TaskList {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.color === 'string'
  )
}

function isSharedListRow(
  x: unknown,
): x is { id: string; name: string; color: string; sharedOwner?: string } {
  if (!isTaskList(x)) return false
  const o = x as Record<string, unknown>
  if (o.sharedOwner === undefined) return true
  return o.sharedOwner === 'Branson' || o.sharedOwner === 'Kelsee'
}

function isSubtask(x: unknown): x is Task['subtasks'][number] {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.completed === 'boolean'
  )
}

function isTask(x: unknown): x is Task {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  const pr = o.priority
  const okPr =
    pr === 'none' ||
    pr === 'low' ||
    pr === 'medium' ||
    pr === 'high' ||
    pr === undefined
  const subs = Array.isArray(o.subtasks) ? o.subtasks : []
  return (
    typeof o.id === 'string' &&
    typeof o.listId === 'string' &&
    typeof o.title === 'string' &&
    typeof o.notes === 'string' &&
    (o.dueDate === null || typeof o.dueDate === 'string') &&
    okPr &&
    typeof o.completed === 'boolean' &&
    (o.completedAt === null || typeof o.completedAt === 'string') &&
    typeof o.createdAt === 'string' &&
    typeof o.order === 'number' &&
    subs.every(isSubtask)
  )
}

function normalizeTask(t: Task): Task {
  return {
    ...t,
    priority: t.priority ?? 'none',
    notes: typeof t.notes === 'string' ? t.notes : '',
    subtasks: Array.isArray(t.subtasks) ? t.subtasks.filter(isSubtask) : [],
  }
}

function defaultLists(): TaskList[] {
  const w = crypto.randomUUID()
  const p = crypto.randomUUID()
  return [
    {
      id: w,
      name: 'Work',
      color: DEFAULT_LIST_COLORS.Work ?? '#7c3aed',
    },
    {
      id: p,
      name: 'Personal',
      color: DEFAULT_LIST_COLORS.Personal ?? '#0d9488',
    },
  ]
}

function loadPrivateTaskLists(user: LifeOsUser): TaskList[] {
  const raw = getUserData(user, TASK_LISTS_KEY)
  if (!Array.isArray(raw) || raw.length === 0) {
    const lists = defaultLists()
    setUserData(user, TASK_LISTS_KEY, lists)
    return lists
  }
  const lists = raw.filter(isTaskList)
  if (lists.length === 0) {
    const next = defaultLists()
    setUserData(user, TASK_LISTS_KEY, next)
    return next
  }
  return lists.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
  }))
}

function loadPrivateTasks(user: LifeOsUser): Task[] {
  const raw = getUserData(user, TASKS_KEY)
  if (!Array.isArray(raw)) {
    setUserData(user, TASKS_KEY, [])
    return []
  }
  return raw.filter(isTask).map(normalizeTask)
}

function loadSharedListsDisk(): Array<{
  id: string
  name: string
  color: string
  sharedOwner?: LifeOsUser
}> {
  const raw = getSharedData(SHARED_TASK_LISTS_KEY)
  if (!Array.isArray(raw)) return []
  return raw.filter(isSharedListRow).map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    sharedOwner:
      row.sharedOwner === 'Branson' || row.sharedOwner === 'Kelsee'
        ? row.sharedOwner
        : undefined,
  }))
}

function loadSharedTasksDisk(): Task[] {
  const raw = getSharedData(SHARED_TASKS_KEY)
  if (!Array.isArray(raw)) return []
  return raw.filter(isTask).map(normalizeTask)
}

export function loadMergedTaskData(user: LifeOsUser): {
  lists: TaskList[]
  tasks: Task[]
} {
  const privateL = loadPrivateTaskLists(user)
  const privateT = loadPrivateTasks(user)
  const sharedRows = loadSharedListsDisk()
  const sharedT = loadSharedTasksDisk()
  const sharedL: TaskList[] = sharedRows.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    shared: true,
    sharedOwner: l.sharedOwner,
  }))
  return {
    lists: [...privateL, ...sharedL],
    tasks: [...privateT, ...sharedT],
  }
}

export function persistMerged(
  user: LifeOsUser,
  lists: TaskList[],
  tasks: Task[],
): void {
  const privateLists = lists
    .filter((l) => !l.shared)
    .map((l) => ({ id: l.id, name: l.name, color: l.color }))
  const sharedLists = lists
    .filter((l) => l.shared)
    .map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      sharedOwner: (l.sharedOwner ?? user) as LifeOsUser,
    }))
  const privateTasks = tasks.filter((t) => {
    const list = lists.find((x) => x.id === t.listId)
    return list != null && !list.shared
  })
  const sharedTasks = tasks.filter((t) => {
    const list = lists.find((x) => x.id === t.listId)
    return list?.shared === true
  })
  setUserData(user, TASK_LISTS_KEY, privateLists)
  setUserData(user, TASKS_KEY, privateTasks)
  setSharedData(SHARED_TASK_LISTS_KEY, sharedLists)
  setSharedData(SHARED_TASKS_KEY, sharedTasks)
}
