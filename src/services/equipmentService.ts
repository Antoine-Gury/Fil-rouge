import { request } from './api'
import type { Equipment } from '../types'

export function getEquipments() {
  return request<Equipment[]>('equipments')
}
