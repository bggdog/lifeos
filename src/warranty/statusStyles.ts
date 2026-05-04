import type { StatusConfigItem } from './types'

/** Maps stored `color` token to chip / badge utility classes. */
export const STATUS_COLOR_CLASS: Record<string, string> = {
  blue: 'border-blue-300/70 bg-blue-100 text-blue-950 dark:border-blue-800/60 dark:bg-blue-950/45 dark:text-blue-100',
  amber:
    'border-amber-300/70 bg-amber-100 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100',
  purple:
    'border-purple-300/70 bg-purple-100 text-purple-950 dark:border-purple-800/60 dark:bg-purple-950/45 dark:text-purple-100',
  teal: 'border-teal-300/70 bg-teal-100 text-teal-950 dark:border-teal-800/60 dark:bg-teal-950/40 dark:text-teal-100',
  gray: 'border-border bg-muted text-foreground dark:bg-muted/40',
  green:
    'border-emerald-300/70 bg-emerald-100 text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100',
  slate:
    'border-slate-400/60 bg-slate-200 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
}

export const COLOR_SWATCHES = [
  'blue',
  'amber',
  'purple',
  'teal',
  'gray',
  'green',
  'slate',
  'rose',
  'cyan',
  'orange',
] as const

export const SWATCH_CLASS: Record<string, string> = {
  rose: 'border-rose-300/70 bg-rose-100 text-rose-950 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-100',
  cyan: 'border-cyan-300/70 bg-cyan-100 text-cyan-950 dark:border-cyan-800/60 dark:bg-cyan-950/40 dark:text-cyan-100',
  orange:
    'border-orange-300/70 bg-orange-100 text-orange-950 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-100',
}

export function statusChipClass(item: StatusConfigItem | undefined): string {
  if (!item) return STATUS_COLOR_CLASS.gray
  return (
    STATUS_COLOR_CLASS[item.color] ??
    SWATCH_CLASS[item.color] ??
    STATUS_COLOR_CLASS.gray
  )
}

export function priorityChipClass(p: string): string {
  switch (p) {
    case 'urgent':
      return 'border-red-400/70 bg-red-100 text-red-950 dark:bg-red-950/50 dark:text-red-100'
    case 'high':
      return 'border-orange-400/70 bg-orange-100 text-orange-950 dark:bg-orange-950/40 dark:text-orange-100'
    case 'medium':
      return 'border-blue-400/70 bg-blue-100 text-blue-950 dark:bg-blue-950/40 dark:text-blue-100'
    default:
      return 'border-border bg-muted text-foreground/80'
  }
}
