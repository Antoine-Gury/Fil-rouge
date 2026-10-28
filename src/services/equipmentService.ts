import { request } from './api'
import type { Equipment, NewEquipment } from '../types'

export function getEquipments() {
  return request<Equipment[]>('equipments')
}

export function createEquipment(equipment: NewEquipment) {
  return request<Equipment>('equipments', {
    method: 'POST',
    body: JSON.stringify(equipment),
  })
}

export function updateEquipment(id: number, equipment: NewEquipment) {
  return request<Equipment>(`equipments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(equipment),
  })
}

export function deleteEquipment(id: number) {
  return request<void>(`equipments/${id}`, { method: 'DELETE' })
}
