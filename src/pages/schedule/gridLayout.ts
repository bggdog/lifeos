import type { ScheduleEvent } from './types'
import {
  GRID_END_MIN,
  GRID_START_MIN,
  LANE_HEIGHT_PX,
  timeToMinutes,
} from './types'

export function layoutEventOnDay(
  e: ScheduleEvent,
  dateISO: string,
  laneHeightPx: number = LANE_HEIGHT_PX,
): { top: number; height: number } | null {
  if (e.date !== dateISO) return null
  const s = timeToMinutes(e.startTime)
  const en = timeToMinutes(e.endTime)
  const topMin = Math.max(s, GRID_START_MIN)
  const bottomMin = Math.min(en, GRID_END_MIN)
  if (bottomMin <= topMin) return null
  return {
    top: ((topMin - GRID_START_MIN) / 60) * laneHeightPx,
    height: Math.max(
      ((bottomMin - topMin) / 60) * laneHeightPx,
      22,
    ),
  }
}

export function totalGridHeightPx(laneHeightPx: number = LANE_HEIGHT_PX): number {
  const rows = (GRID_END_MIN - GRID_START_MIN) / 60
  return rows * laneHeightPx
}

/** Layout a vertical range by absolute minute-of-day (not necessarily tied to an event). */
export function layoutMinuteRange(
  startMin: number,
  endMin: number,
  laneHeightPx: number = LANE_HEIGHT_PX,
): { top: number; height: number } | null {
  const topMin = Math.max(Math.min(startMin, endMin), GRID_START_MIN)
  const bottomMin = Math.min(Math.max(startMin, endMin), GRID_END_MIN)
  if (bottomMin <= topMin) return null
  return {
    top: ((topMin - GRID_START_MIN) / 60) * laneHeightPx,
    height: Math.max(((bottomMin - topMin) / 60) * laneHeightPx, 8),
  }
}
