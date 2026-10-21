export type EquipmentStatus = 'online' | 'offline'
export type IncidentSeverity = 'high' | 'medium' | 'low'
export type IncidentStatus = 'open' | 'in_progress' | 'resolved'
export type UserRole = 'admin' | 'operator' | 'viewer'

export interface Equipment {
  id: number
  name: string
  type: string
  site: string
  status: EquipmentStatus
}

export interface Incident {
  id: number
  title: string
  severity: IncidentSeverity
  status: IncidentStatus
  equipmentId: number
}

export type NewIncident = Omit<Incident, 'id'>

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
}
