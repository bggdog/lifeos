import type { StatusConfigItem, Ticket } from './types'
import { isTerminalStatus, newId, nowIso } from './utils'

export function withStatusChange(
  ticket: Ticket,
  toStatus: string,
  note: string,
  statusConfig: StatusConfigItem[],
): Ticket {
  if (ticket.status === toStatus) return ticket
  const ts = nowIso()
  const entry = {
    id: newId(),
    fromStatus: ticket.status,
    toStatus,
    note,
    changedAt: ts,
  }
  let resolvedAt = ticket.resolvedAt
  if (isTerminalStatus(toStatus, statusConfig)) {
    if (!resolvedAt) resolvedAt = ts
  }
  return {
    ...ticket,
    status: toStatus,
    statusHistory: [entry, ...ticket.statusHistory],
    updatedAt: ts,
    resolvedAt,
  }
}
