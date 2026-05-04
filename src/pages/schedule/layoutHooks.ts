import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'
import { LANE_HEIGHT_PX, SCHEDULE_GRID_ROW_COUNT } from './types'

/** Observe element width; true when below `maxWidth` (CSS px). */
export function useContainerNarrow(
  elRef: RefObject<HTMLElement | null>,
  maxWidth = 768,
): boolean {
  const [narrow, setNarrow] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(`(max-width: ${maxWidth - 1}px)`).matches
  })

  useLayoutEffect(() => {
    const el = elRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width
      setNarrow(w < maxWidth)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [elRef, maxWidth])

  return narrow
}

/**
 * Pixel height of one hour row, derived from the lane element so drag math,
 * event layout, and painted rows stay aligned at any zoom / density.
 */
export function useScheduleSlotHeight(
  laneRef: RefObject<HTMLElement | null>,
): number {
  const [slot, setSlot] = useState(LANE_HEIGHT_PX)

  useLayoutEffect(() => {
    const el = laneRef.current
    if (!el) return

    const measure = () => {
      const h = el.clientHeight
      if (h < 16) return
      const next = h / SCHEDULE_GRID_ROW_COUNT
      if (!Number.isFinite(next) || next <= 0) return
      setSlot((prev) => (Math.abs(prev - next) < 0.5 ? prev : next))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [laneRef])

  return slot
}
