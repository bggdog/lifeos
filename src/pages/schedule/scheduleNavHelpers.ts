import {
  addDays,
  formatDayHeading,
  formatWeekRangeLabel,
  parseISODate,
  toISODate,
} from './types'

export function scheduleDayNavLabel(dayISO: string): string {
  return formatDayHeading(parseISODate(dayISO))
}

export function addDaysToIso(dayISO: string, delta: number): string {
  const d = parseISODate(dayISO)
  d.setDate(d.getDate() + delta)
  return toISODate(d)
}

export function weekNavLabel(
  isNarrow: boolean,
  weekStart: Date,
  threeCenter: Date,
): string {
  if (isNarrow) {
    return `${formatWeekRangeLabel(addDays(threeCenter, -1)).split('–')[0]?.trim() ?? ''} …`
  }
  return formatWeekRangeLabel(weekStart)
}
