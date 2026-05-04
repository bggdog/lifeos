import {
  GRID_END_MIN,
  GRID_START_MIN,
  LANE_HEIGHT_PX,
  SCHEDULE_FIRST_HOUR,
} from './types'
import { layoutMinuteRange } from './gridLayout'

export const DRAG_MOVE_THRESHOLD_PX = 6

/** Raw minute-of-day from Y position inside the lane (0 = top of grid content). */
export function localYToRawMinutes(
  localY: number,
  laneHeightPx: number = LANE_HEIGHT_PX,
): number {
  return GRID_START_MIN + (localY / laneHeightPx) * 60
}

export function clampToGridMinutes(m: number): number {
  return Math.min(GRID_END_MIN, Math.max(GRID_START_MIN, m))
}

export function snap30Floor(m: number): number {
  return Math.floor(m / 30) * 30
}

export function snap30Ceil(m: number): number {
  return Math.ceil(m / 30) * 30
}

export function minutesToHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatTimeRangePreview(startMin: number, endMin: number): string {
  const d0 = new Date(2000, 0, 1, 0, 0, 0, 0)
  d0.setHours(0, 0, 0, 0)
  d0.setMinutes(startMin)
  const d1 = new Date(2000, 0, 1, 0, 0, 0, 0)
  d1.setMinutes(endMin)
  const a = d0.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const b = d1.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${a} – ${b}`
}

export function ghostFromMinutes(
  startMin: number,
  endMin: number,
  laneHeightPx: number = LANE_HEIGHT_PX,
): {
  top: number
  height: number
  label: string
} | null {
  const lo = Math.min(startMin, endMin)
  const hi = Math.max(startMin, endMin)
  const layout = layoutMinuteRange(lo, hi, laneHeightPx)
  if (!layout) return null
  return {
    top: layout.top,
    height: layout.height,
    label: formatTimeRangePreview(lo, hi),
  }
}

/** Default 1-hour block from raw Y (click). */
export function defaultHourBlockFromRawY(
  rawMinutes: number,
  dateISO: string,
): { date: string; startTime: string; endTime: string } {
  const clamped = clampToGridMinutes(rawMinutes)
  const slotStart = snap30Floor(clamped)
  const start = minutesToHHMM(slotStart)
  const endCap = Math.min(slotStart + 60, GRID_END_MIN)
  const end = minutesToHHMM(endCap)
  return { date: dateISO, startTime: start, endTime: end }
}

/** Final range from drag (already have raw y0/y1 as minutes). */
export function rangeFromDragRawMinutes(
  rawA: number,
  rawB: number,
): { startTime: string; endTime: string } {
  const a = clampToGridMinutes(rawA)
  const b = clampToGridMinutes(rawB)
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const start = snap30Floor(lo)
  let end = snap30Ceil(hi)
  if (end - start < 30) {
    end = Math.min(start + 30, GRID_END_MIN)
  }
  if (end <= start) {
    end = Math.min(start + 30, GRID_END_MIN)
  }
  return { startTime: minutesToHHMM(start), endTime: minutesToHHMM(end) }
}

export function rawYToHourForSlot(rawMinutes: number): number {
  const clamped = clampToGridMinutes(rawMinutes)
  const hourIdx = Math.floor((clamped - GRID_START_MIN) / 60)
  return SCHEDULE_FIRST_HOUR + hourIdx
}
