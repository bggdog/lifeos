import type { PointerEvent as ReactPointerEvent } from 'react'
import type { RefObject } from 'react'
import { useCallback, useRef, useState } from 'react'
import { timeToMinutes } from './types'
import {
  DRAG_MOVE_THRESHOLD_PX,
  defaultHourBlockFromRawY,
  ghostFromMinutes,
  localYToRawMinutes,
  rangeFromDragRawMinutes,
} from './timeGridPointer'

export type TimeGridGhost = {
  top: number
  height: number
  label: string
  /** Column (day) the drag started in — preview only shows here in week view. */
  dateISO: string
}

type Options = {
  laneRef: RefObject<HTMLDivElement | null>
  /** Measured hour-row height; keeps drag + ghost aligned with painted grid. */
  slotHeightPx: number
  /** Called after a drag commit (snapped range, min 30 min). */
  onDragCreate: (dateISO: string, startTime: string, endTime: string) => void
  /** Single click / tiny movement: 1-hour block from snapped slot. */
  onClickCreate: (dateISO: string, startTime: string, endTime: string) => void
  /** Resolve which day column the pointer is in (week); day view returns fixed ISO. */
  resolveDateISO: (clientX: number, clientY: number) => string | null
}

export function useTimeGridDrag({
  laneRef,
  slotHeightPx,
  onDragCreate,
  onClickCreate,
  resolveDateISO,
}: Options) {
  const [ghost, setGhost] = useState<TimeGridGhost | null>(null)
  const [selectNone, setSelectNone] = useState(false)
  const dragRef = useRef<{
    pointerId: number
    startClientY: number
    startClientX: number
    startRawMin: number
    dateISO: string
    maxMove: number
  } | null>(null)

  const endDrag = useCallback(() => {
    dragRef.current = null
    setGhost(null)
    setSelectNone(false)
  }, [])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const el = (e.target as HTMLElement).closest('[data-schedule-event]')
      if (el) return
      const lane = laneRef.current
      if (!lane) return
      const dateISO = resolveDateISO(e.clientX, e.clientY)
      if (!dateISO) return

      const r = lane.getBoundingClientRect()
      const localY = e.clientY - r.top
      const raw = localYToRawMinutes(localY, slotHeightPx)

      lane.setPointerCapture(e.pointerId)
      dragRef.current = {
        pointerId: e.pointerId,
        startClientY: e.clientY,
        startClientX: e.clientX,
        startRawMin: raw,
        dateISO,
        maxMove: 0,
      }
      setSelectNone(true)
      setGhost(null)
    },
    [laneRef, resolveDateISO, slotHeightPx],
  )

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    const lane = laneRef.current
    if (!d || !lane || e.pointerId !== d.pointerId) return

    d.maxMove = Math.max(
      d.maxMove,
      Math.abs(e.clientY - d.startClientY),
      Math.abs(e.clientX - d.startClientX),
    )

    const r = lane.getBoundingClientRect()
    const localY = e.clientY - r.top
    const raw = localYToRawMinutes(localY, slotHeightPx)

    const { startTime, endTime } = rangeFromDragRawMinutes(d.startRawMin, raw)
    const g = ghostFromMinutes(
      timeToMinutes(startTime),
      timeToMinutes(endTime),
      slotHeightPx,
    )
    setGhost(g ? { ...g, dateISO: d.dateISO } : null)
  }, [laneRef, slotHeightPx])

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = dragRef.current
      const lane = laneRef.current
      if (!d || e.pointerId !== d.pointerId) return
      try {
        lane?.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }

      const r = lane?.getBoundingClientRect()
      if (!r) {
        endDrag()
        return
      }
      const localY = e.clientY - r.top
      const rawEnd = localYToRawMinutes(localY, slotHeightPx)
      const moved = d.maxMove >= DRAG_MOVE_THRESHOLD_PX

      if (moved) {
        const { startTime, endTime } = rangeFromDragRawMinutes(
          d.startRawMin,
          rawEnd,
        )
        onDragCreate(d.dateISO, startTime, endTime)
      } else {
        const block = defaultHourBlockFromRawY(d.startRawMin, d.dateISO)
        onClickCreate(block.date, block.startTime, block.endTime)
      }
      endDrag()
    },
    [laneRef, endDrag, onClickCreate, onDragCreate, slotHeightPx],
  )

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = dragRef.current
      if (!d || e.pointerId !== d.pointerId) return
      try {
        laneRef.current?.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      endDrag()
    },
    [laneRef, endDrag],
  )

  return {
    ghost,
    selectNone,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  }
}
