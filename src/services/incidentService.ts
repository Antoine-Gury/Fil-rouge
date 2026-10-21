import { request } from './api'
import type { Incident, NewIncident } from '../types'

export function getIncidents() {
  return request<Incident[]>('incidents')
}

export function createIncident(incident: NewIncident) {
  return request<Incident>('incidents', {
    method: 'POST',
    body: JSON.stringify(incident),
  })
}
