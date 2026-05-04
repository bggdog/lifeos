export const GOALS_KEY = 'goals'

export type GoalCategory =
  | 'work'
  | 'personal'
  | 'health'
  | 'creative'
  | 'financial'

export type GoalStatus = 'inProgress' | 'completed'

export type GoalMilestone = {
  id: string
  title: string
  completed: boolean
  targetDate: string | null
  order: number
}

export type Goal = {
  id: string
  title: string
  category: GoalCategory
  targetDate: string | null
  notes: string
  status: GoalStatus
  completedAt: string | null
  createdAt: string
  milestones: GoalMilestone[]
  linkedTaskIds: string[]
}

export type GoalFilter = 'all' | 'inProgress' | 'completed'

export const GOAL_CATEGORIES: GoalCategory[] = [
  'work',
  'personal',
  'health',
  'creative',
  'financial',
]
