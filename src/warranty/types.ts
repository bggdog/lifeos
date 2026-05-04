import { COMM_TYPES } from './constants'

export type WarrantyPriority = 'low' | 'medium' | 'high' | 'urgent'

export type CommunicationType = (typeof COMM_TYPES)[number]

export type StatusConfigItem = {
  id: string
  label: string
  color: string
  order: number
}

export type Community = {
  id: string
  name: string
  builder: string
  address: string
  totalHomes: number
  notes: string
  createdAt: string
}

export type Homeowner = {
  name: string
  email: string
  phone: string
}

export type Home = {
  id: string
  communityId: string
  address: string
  lotNumber: string
  homeowner: Homeowner
  closingDate: string | null
  notes: string
  createdAt: string
}

export type Appointment = {
  id: string
  date: string
  time: string
  notes: string
  confirmed: boolean
}

export type StatusHistoryEntry = {
  id: string
  fromStatus: string | null
  toStatus: string
  note: string
  changedAt: string
}

export type CommunicationEntry = {
  id: string
  type: CommunicationType
  content: string
  createdAt: string
}

export type AttachmentEntry = {
  id: string
  name: string
  dataUrl: string
  type: string
  uploadedAt: string
}

export type Ticket = {
  id: string
  homeId: string
  communityId: string
  title: string
  description: string
  status: string
  customStatuses: string[]
  priority: WarrantyPriority
  category: string
  assignedContractorId: string | null
  appointments: Appointment[]
  statusHistory: StatusHistoryEntry[]
  communications: CommunicationEntry[]
  attachments: AttachmentEntry[]
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

export type Contractor = {
  id: string
  name: string
  company: string
  phone: string
  email: string
  trade: string
  notes: string
  createdAt: string
}

export type TicketsViewMode = 'list' | 'kanban'
