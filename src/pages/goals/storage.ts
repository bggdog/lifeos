import type { LifeOsUser } from '../../context/UserContext'
import { getUserData, setUserData } from '../../lib/storage'
import type { Goal, GoalCategory, GoalMilestone, GoalStatus } from './types'
import { GOALS_KEY, GOAL_CATEGORIES } from './types'

const CATEGORIES = new Set<string>(GOAL_CATEGORIES)

function isGoalCategory(x: unknown): x is GoalCategory {
  return typeof x === 'string' && CATEGORIES.has(x)
}

function isGoalStatus(x: unknown): x is GoalStatus {
  return x === 'inProgress' || x === 'completed'
}

function isMilestone(x: unknown): x is GoalMilestone {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.completed === 'boolean' &&
    (o.targetDate === null || typeof o.targetDate === 'string') &&
    typeof o.order === 'number'
  )
}

function isGoal(x: unknown): x is Goal {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  const ms = Array.isArray(o.milestones) ? o.milestones : []
  const links = Array.isArray(o.linkedTaskIds) ? o.linkedTaskIds : []
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    isGoalCategory(o.category) &&
    (o.targetDate === null || typeof o.targetDate === 'string') &&
    typeof o.notes === 'string' &&
    isGoalStatus(o.status) &&
    (o.completedAt === null || typeof o.completedAt === 'string') &&
    typeof o.createdAt === 'string' &&
    ms.every(isMilestone) &&
    links.every((id) => typeof id === 'string')
  )
}

function normalizeGoal(g: Goal): Goal {
  const milestones = [...g.milestones]
    .filter(isMilestone)
    .sort((a, b) => a.order - b.order)
  return {
    ...g,
    notes: typeof g.notes === 'string' ? g.notes : '',
    milestones,
    linkedTaskIds: Array.isArray(g.linkedTaskIds)
      ? g.linkedTaskIds.filter((id) => typeof id === 'string')
      : [],
  }
}

export function loadGoals(user: LifeOsUser): Goal[] {
  const raw = getUserData(user, GOALS_KEY)
  if (!Array.isArray(raw)) {
    setUserData(user, GOALS_KEY, [])
    return []
  }
  return raw.filter(isGoal).map(normalizeGoal)
}

export function persistGoals(user: LifeOsUser, goals: Goal[]): void {
  setUserData(user, GOALS_KEY, goals)
}
