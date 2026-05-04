import type { GoalCategory } from './types'

export const CATEGORY_LABEL: Record<GoalCategory, string> = {
  work: 'Work',
  personal: 'Personal',
  health: 'Health',
  creative: 'Creative',
  financial: 'Financial',
}

/** Top bar / accents — per spec */
export const CATEGORY_COLOR: Record<GoalCategory, string> = {
  work: '#7c3aed',
  personal: '#0d9488',
  health: '#16a34a',
  creative: '#d97706',
  financial: '#2563eb',
}
