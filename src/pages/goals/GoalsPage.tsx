import { Button, Text, useMediaQuery } from '@heroui/react'
import { motion } from 'framer-motion'
import { Plus, Target } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { I18nProvider } from 'react-aria-components'
import type { LifeOsUser } from '../../context/UserContext'
import { useUser } from '../../context/UserContext'
import { subscribeKv } from '../../lib/storage'
import { loadMergedTaskData, persistMerged } from '../tasks/storage'
import type { Task, TaskList } from '../tasks/types'
import { AddGoalModal, type AddGoalDraft } from './AddGoalModal'
import { GoalCard } from './GoalCard'
import { GoalDetailPanel } from './GoalDetailPanel'
import {
  filterGoals,
  sortGoalsByTarget,
  todayISO,
} from './goalUtils'
import type { Goal, GoalFilter } from './types'
import { loadGoals, persistGoals } from './storage'

const FILTER_TABS: { id: GoalFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
]

const gridContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
      when: 'beforeChildren' as const,
    },
  },
}

const gridItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 380,
      damping: 28,
    },
  },
}

function GoalsInner({ user }: { user: LifeOsUser }) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const today = todayISO()

  const [goals, setGoals] = useState<Goal[]>(() => loadGoals(user))
  const [lists, setLists] = useState<TaskList[]>(
    () => loadMergedTaskData(user).lists,
  )
  const [tasks, setTasks] = useState<Task[]>(
    () => loadMergedTaskData(user).tasks,
  )

  const [filter, setFilter] = useState<GoalFilter>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null)
  const [emphasizeId, setEmphasizeId] = useState<string | null>(null)

  const persistAllTasks = useCallback(
    (nextLists: TaskList[], nextTasks: Task[]) => {
      setLists(nextLists)
      setTasks(nextTasks)
      persistMerged(user, nextLists, nextTasks)
    },
    [user],
  )

  const saveGoals = useCallback(
    (next: Goal[]) => {
      setGoals(next)
      persistGoals(user, next)
    },
    [user],
  )

  useEffect(
    () =>
      subscribeKv(() => {
        setGoals(loadGoals(user))
        const merged = loadMergedTaskData(user)
        setLists(merged.lists)
        setTasks(merged.tasks)
      }),
    [user],
  )

  const updateGoal = useCallback(
    (id: string, patch: Partial<Goal>) => {
      saveGoals(
        goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
      )
      setDetailGoal((d) => (d?.id === id ? { ...d, ...patch } : d))
    },
    [goals, saveGoals],
  )

  const filteredSorted = useMemo(() => {
    const f = filterGoals(goals, filter)
    return sortGoalsByTarget(f)
  }, [goals, filter])

  const addGoalFromModal = (d: AddGoalDraft) => {
    const id = crypto.randomUUID()
    const row: Goal = {
      id,
      title: d.title.trim(),
      category: d.category,
      targetDate: d.targetDate,
      notes: d.notes.trim(),
      status: 'inProgress',
      completedAt: null,
      createdAt: new Date().toISOString(),
      milestones: [],
      linkedTaskIds: [],
    }
    saveGoals([...goals, row])
    setEmphasizeId(id)
    globalThis.setTimeout(() => setEmphasizeId(null), 700)
  }

  const deleteGoal = (id: string) => {
    saveGoals(goals.filter((g) => g.id !== id))
    setDetailGoal((d) => (d?.id === id ? null : d))
  }

  const linkedCount = useCallback(
    (g: Goal) =>
      g.linkedTaskIds.filter((id) => tasks.some((t) => t.id === id)).length,
    [tasks],
  )

  return (
    <I18nProvider locale="en-US">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/50 bg-background px-3 py-3 md:px-5">
          <Text className="text-lg font-semibold tracking-tight md:text-xl">
            Goals
          </Text>
          <Button
            variant="primary"
            size="sm"
            className="shrink-0 rounded-full"
            onPress={() => setAddOpen(true)}
          >
            <Plus className="mr-1 size-4" />
            Add Goal
          </Button>
        </header>

        <div className="flex shrink-0 gap-1 border-b border-border/40 px-3 py-2 md:px-5">
          {FILTER_TABS.map((t) => (
            <Button
              key={t.id}
              variant={filter === t.id ? 'primary' : 'ghost'}
              size="sm"
              className="rounded-full"
              onPress={() => setFilter(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto p-3 md:p-5">
          {goals.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
              <div className="flex size-20 items-center justify-center rounded-3xl border border-dashed border-border/60 bg-surface/30 text-foreground/25">
                <Target className="size-10" strokeWidth={1.25} />
              </div>
              <Text className="max-w-sm text-center text-base text-foreground/60">
                Set your first goal — where do you want to be?
              </Text>
              <Button variant="primary" onPress={() => setAddOpen(true)}>
                <Plus className="mr-1 size-4" />
                Add Goal
              </Button>
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <Text className="text-sm text-foreground/50">
                Nothing here yet.
              </Text>
            </div>
          ) : (
            <motion.div
              variants={gridContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {filteredSorted.map((g) => (
                <motion.div key={g.id} variants={gridItem} layout>
                  <GoalCard
                    goal={g}
                    today={today}
                    linkedTaskCount={linkedCount(g)}
                    emphasizeEnter={emphasizeId === g.id}
                    onOpen={() => setDetailGoal(g)}
                    onEdit={() => setDetailGoal(g)}
                    onMarkComplete={() =>
                      updateGoal(g.id, {
                        status: 'completed',
                        completedAt: new Date().toISOString(),
                      })
                    }
                    onRequestDelete={() => setPendingDelete(g)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {detailGoal ? (
            <GoalDetailPanel
              goal={detailGoal}
              tasks={tasks}
              isMobile={Boolean(isMobile)}
              onClose={() => setDetailGoal(null)}
              onUpdateGoal={updateGoal}
              onPersistTasks={(next) => persistAllTasks(lists, next)}
            />
          ) : null}
        </div>

        {addOpen ? (
          <AddGoalModal
            onOpenChange={setAddOpen}
            onSave={addGoalFromModal}
          />
        ) : null}

        {pendingDelete ? (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-xl">
              <Text className="text-base font-semibold">Delete goal?</Text>
              <Text className="mt-2 text-sm text-foreground/65">
                “{pendingDelete.title}” will be removed. This cannot be undone.
              </Text>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onPress={() => setPendingDelete(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onPress={() => {
                    deleteGoal(pendingDelete.id)
                    setPendingDelete(null)
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </I18nProvider>
  )
}

export function GoalsPage() {
  const { activeUser } = useUser()
  if (!activeUser) return null
  return <GoalsInner key={activeUser} user={activeUser} />
}
