import { Button, Text, useMediaQuery } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { I18nProvider } from 'react-aria-components'
import type { LifeOsUser } from '../../context/UserContext'
import { useUser } from '../../context/UserContext'
import { AddTaskModal, type AddTaskDraft } from './AddTaskModal'
import { ListSidebar } from './ListSidebar'
import {
  headerTitle,
  todayISO,
} from './selectors'
import { loadMergedTaskData, persistMerged } from './storage'
import { TaskDetailPanel } from './TaskDetailPanel'
import { TaskListView } from './TaskListView'
import type { Selection, Task, TaskList } from './types'
import {
  SHARED_TASK_LISTS_KEY,
  SHARED_TASKS_KEY,
  TASK_LISTS_KEY,
  TASKS_KEY,
} from './types'

function TasksInner({ user }: { user: LifeOsUser }) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [lists, setLists] = useState<TaskList[]>(
    () => loadMergedTaskData(user).lists,
  )
  const [tasks, setTasks] = useState<Task[]>(
    () => loadMergedTaskData(user).tasks,
  )
  const [selection, setSelection] = useState<Selection>({
    kind: 'smart',
    id: 'today',
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const today = todayISO()

  const persistAll = useCallback(
    (nextLists: TaskList[], nextTasks: Task[]) => {
      setLists(nextLists)
      setTasks(nextTasks)
      persistMerged(user, nextLists, nextTasks)
    },
    [user],
  )

  const saveLists = useCallback(
    (next: TaskList[]) => {
      persistAll(next, tasks)
    },
    [persistAll, tasks],
  )

  const saveTasks = useCallback(
    (next: Task[]) => {
      persistAll(lists, next)
    },
    [persistAll, lists],
  )

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return
      const sharedListsKey = `shared.${SHARED_TASK_LISTS_KEY}`
      const sharedTasksKey = `shared.${SHARED_TASKS_KEY}`
      const userListsKey = `${user}.${TASK_LISTS_KEY}`
      const userTasksKey = `${user}.${TASKS_KEY}`
      if (
        e.key === sharedListsKey ||
        e.key === sharedTasksKey ||
        e.key === userListsKey ||
        e.key === userTasksKey
      ) {
        const next = loadMergedTaskData(user)
        setLists(next.lists)
        setTasks(next.tasks)
      }
    }
    globalThis.addEventListener('storage', onStorage)
    return () => globalThis.removeEventListener('storage', onStorage)
  }, [user])

  const shareList = useCallback(
    (listId: string) => {
      const list = lists.find((l) => l.id === listId && !l.shared)
      if (!list) return
      const newList: TaskList = {
        ...list,
        shared: true,
        sharedOwner: user,
      }
      const privateWithout = lists.filter((l) => !l.shared && l.id !== listId)
      const sharedAll = [...lists.filter((l) => l.shared), newList]
      persistAll([...privateWithout, ...sharedAll], tasks)
    },
    [lists, tasks, persistAll, user],
  )

  const unshareList = useCallback(
    (listId: string) => {
      const list = lists.find((l) => l.id === listId && l.shared)
      if (!list || list.sharedOwner !== user) return
      const privatePart = lists.filter((l) => !l.shared)
      const restored: TaskList = {
        id: list.id,
        name: list.name,
        color: list.color,
      }
      const sharedRest = lists.filter((l) => l.shared && l.id !== listId)
      persistAll([...privatePart, restored, ...sharedRest], tasks)
    },
    [lists, tasks, persistAll, user],
  )

  const defaultListId =
    selection.kind === 'list'
      ? selection.id
      : (lists[0]?.id ?? '')

  const duplicateTask = (task: Task) => {
    const same = tasks.filter((t) => t.listId === task.listId)
    const maxO = same.reduce((m, t) => Math.max(m, t.order), -1)
    const copy: Task = {
      ...task,
      id: crypto.randomUUID(),
      title: `${task.title} (copy)`,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      order: maxO + 1,
      subtasks: task.subtasks.map((s) => ({
        ...s,
        id: crypto.randomUUID(),
        completed: false,
      })),
    }
    saveTasks([...tasks, copy])
  }

  const deleteTask = (task: Task) => {
    saveTasks(tasks.filter((t) => t.id !== task.id))
    setDetailTask((d) => (d?.id === task.id ? null : d))
  }

  const addList = (name: string) => {
    const color = ['#7c3aed', '#0d9488', '#ea580c', '#2563eb'][
      lists.length % 4
    ]!
    persistAll(
      [...lists, { id: crypto.randomUUID(), name: name.trim(), color }],
      tasks,
    )
  }

  const deleteList = (id: string) => {
    persistAll(
      lists.filter((l) => l.id !== id),
      tasks.filter((t) => t.listId !== id),
    )
    if (selection.kind === 'list' && selection.id === id) {
      setSelection({ kind: 'smart', id: 'today' })
    }
  }

  const onAddFromModal = (d: AddTaskDraft) => {
    const listId = d.listId
    const same = tasks.filter((t) => t.listId === listId)
    const maxO = same.reduce((m, t) => Math.max(m, t.order), -1)
    const row: Task = {
      id: crypto.randomUUID(),
      listId,
      title: d.title,
      notes: d.notes,
      dueDate: d.dueDate,
      priority: d.priority,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      order: maxO + 1,
      subtasks: [],
    }
    saveTasks([...tasks, row])
  }

  const updateTask = (id: string, patch: Partial<Task>) => {
    saveTasks(
      tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    )
    setDetailTask((d) =>
      d?.id === id ? { ...d, ...patch } : d,
    )
  }

  const addSubtask = (taskId: string, title: string) => {
    saveTasks(
      tasks.map((t) => {
        if (t.id !== taskId) return t
        return {
          ...t,
          subtasks: [
            ...t.subtasks,
            { id: crypto.randomUUID(), title, completed: false },
          ],
        }
      }),
    )
    setDetailTask((d) =>
      d?.id === taskId
        ? {
            ...d,
            subtasks: [
              ...d.subtasks,
              { id: crypto.randomUUID(), title, completed: false },
            ],
          }
        : d,
    )
  }

  const toggleSub = (taskId: string, subId: string, completed: boolean) => {
    saveTasks(
      tasks.map((t) => {
        if (t.id !== taskId) return t
        return {
          ...t,
          subtasks: t.subtasks.map((s) =>
            s.id === subId ? { ...s, completed } : s,
          ),
        }
      }),
    )
    setDetailTask((d) =>
      d?.id === taskId
        ? {
            ...d,
            subtasks: d.subtasks.map((s) =>
              s.id === subId ? { ...s, completed } : s,
            ),
          }
        : d,
    )
  }

  const title = headerTitle(selection, lists)

  return (
    <I18nProvider locale="en-US">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-border/50 bg-background px-3 py-2 md:px-4">
          {isMobile ? (
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label="Open lists"
              className="shrink-0"
              onPress={() => setSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
          ) : null}
          <Text className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight md:text-lg">
            {title}
          </Text>
          <Button
            variant="primary"
            size="sm"
            className="shrink-0 rounded-full"
            onPress={() => setAddOpen(true)}
          >
            <Plus className="mr-1 size-4" />
            Add Task
          </Button>
        </header>

        <div className="relative flex min-h-0 flex-1">
          {!isMobile ? (
            <aside className="w-[260px] shrink-0">
              <ListSidebar
                activeUser={user}
                lists={lists}
                tasks={tasks}
                selection={selection}
                onSelect={(s) => {
                  setSelection(s)
                  setDetailTask(null)
                }}
                onReorderLists={saveLists}
                onRenameList={(id, name) =>
                  saveLists(
                    lists.map((l) => (l.id === id ? { ...l, name } : l)),
                  )
                }
                onSetListColor={(id, color) =>
                  saveLists(
                    lists.map((l) => (l.id === id ? { ...l, color } : l)),
                  )
                }
                onDeleteList={deleteList}
                onAddList={addList}
                onShareList={shareList}
                onUnshareList={unshareList}
              />
            </aside>
          ) : null}

          {isMobile ? (
            <AnimatePresence mode="sync">
              {sidebarOpen ? (
                <>
                  <motion.button
                    type="button"
                    aria-label="Close menu"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[160] bg-black/40"
                    onClick={() => setSidebarOpen(false)}
                  />
                  <motion.aside
                    initial={{ x: -280 }}
                    animate={{ x: 0 }}
                    exit={{ x: -280 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    className="fixed inset-y-0 left-0 z-[170] w-[260px] max-w-[85vw] border-r border-border/50 bg-background shadow-xl"
                  >
                    <ListSidebar
                      activeUser={user}
                      lists={lists}
                      tasks={tasks}
                      selection={selection}
                      onSelect={(s) => {
                        setSelection(s)
                        setDetailTask(null)
                        setSidebarOpen(false)
                      }}
                      onReorderLists={saveLists}
                      onRenameList={(id, name) =>
                        saveLists(
                          lists.map((l) =>
                            l.id === id ? { ...l, name } : l,
                          ),
                        )
                      }
                      onSetListColor={(id, color) =>
                        saveLists(
                          lists.map((l) =>
                            l.id === id ? { ...l, color } : l,
                          ),
                        )
                      }
                      onDeleteList={deleteList}
                      onAddList={addList}
                      onShareList={shareList}
                      onUnshareList={unshareList}
                    />
                  </motion.aside>
                </>
              ) : null}
            </AnimatePresence>
          ) : null}

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <TaskListView
              lists={lists}
              tasks={tasks}
              selection={selection}
              today={today}
              detailOpen={detailTask != null}
              onTasksChange={saveTasks}
              onOpenDetail={(t) => setDetailTask(t)}
              onDuplicate={duplicateTask}
              onDelete={deleteTask}
            />

            {detailTask ? (
              <TaskDetailPanel
                task={detailTask}
                lists={lists}
                isMobile={Boolean(isMobile)}
                onClose={() => setDetailTask(null)}
                onUpdate={updateTask}
                onAddSubtask={addSubtask}
                onToggleSubtask={toggleSub}
              />
            ) : null}
          </div>
        </div>

        {addOpen ? (
          <AddTaskModal
            key={defaultListId}
            onOpenChange={setAddOpen}
            lists={lists}
            defaultListId={defaultListId}
            onSave={(d) => {
              onAddFromModal(d)
              setAddOpen(false)
            }}
          />
        ) : null}
      </div>
    </I18nProvider>
  )
}

export function TasksPage() {
  const { activeUser } = useUser()
  if (!activeUser) return null
  return <TasksInner key={activeUser} user={activeUser} />
}
