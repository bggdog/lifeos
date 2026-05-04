import { Chip, ChipLabel } from '@heroui/react'
import type { StatusConfigItem } from '../types'
import { statusChipClass } from '../statusStyles'

export function StatusBadge({
  statusId,
  statusConfig,
}: {
  statusId: string
  statusConfig: StatusConfigItem[]
}) {
  const item = statusConfig.find((s) => s.id === statusId)
  const label = item?.label ?? statusId
  return (
    <Chip
      size="sm"
      variant="secondary"
      className={`border font-medium ${statusChipClass(item)}`}
    >
      <ChipLabel>{label}</ChipLabel>
    </Chip>
  )
}
