import type { StatusConfigItem } from './types'

export const DEFAULT_STATUS_CONFIG: StatusConfigItem[] = [
  { id: 'new', label: 'New', color: 'blue', order: 0 },
  { id: 'in-progress', label: 'In Progress', color: 'amber', order: 1 },
  {
    id: 'pending-homeowner',
    label: 'Pending Homeowner',
    color: 'purple',
    order: 2,
  },
  { id: 'scheduled', label: 'Scheduled', color: 'teal', order: 3 },
  { id: 'on-hold', label: 'On Hold', color: 'gray', order: 4 },
  { id: 'resolved', label: 'Resolved', color: 'green', order: 5 },
  { id: 'closed', label: 'Closed', color: 'slate', order: 6 },
]
