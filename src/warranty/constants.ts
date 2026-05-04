/** All warranty keys are stored under Kelsee via getUserData/setUserData. */
export const WARRANTY_USER = 'Kelsee' as const

export const KEYS = {
  communities: 'warranty.communities',
  homes: 'warranty.homes',
  tickets: 'warranty.tickets',
  contractors: 'warranty.contractors',
  statusConfig: 'warranty.statusConfig',
  ticketsView: 'warranty.ticketsView',
} as const

export const TICKET_CATEGORIES = [
  'Plumbing',
  'HVAC',
  'Electrical',
  'Structural',
  'Cosmetic',
  'Appliance',
  'Other',
] as const

export const CONTRACTOR_TRADES = [
  'Plumbing',
  'HVAC',
  'Electrical',
  'Structural',
  'General',
  'Other',
] as const

export const COMM_TYPES = ['note', 'email', 'call', 'text'] as const
