import type { Equipment, Incident, User, UserRole } from '../types'

async function adminRequest<T>(action: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: object, id?: number): Promise<T> {
  const search = new URLSearchParams({ action })
  if (id !== undefined) search.set('id', String(id))

  let response: Response
  try {
    response = await fetch(`/api/admin.php?${search}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Impossible de joindre le serveur d’administration.')
  }

  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'message' in result && typeof result.message === 'string'
      ? result.message
      : `Le serveur d’administration a répondu avec une erreur (${response.status}).`
    throw new Error(message)
  }
  return result as T
}

export async function getAdminUsers() {
  const result = await adminRequest<{ users: User[] }>('users', 'GET')
  return result.users
}

export async function updateUserRole(id: number, role: UserRole) {
  const result = await adminRequest<{ user: User }>('user-role', 'PATCH', { role }, id)
  return result.user
}

export function deleteUser(id: number) {
  return adminRequest<{ deleted: true }>('user', 'DELETE', undefined, id)
}

export function createEquipment(equipment: Omit<Equipment, 'id'>) {
  return adminRequest<Equipment>('equipment', 'POST', equipment)
}

export function updateEquipment(id: number, equipment: Omit<Equipment, 'id'>) {
  return adminRequest<Equipment>('equipment', 'PATCH', equipment, id)
}

export function deleteEquipment(id: number) {
  return adminRequest<{ deleted: true }>('equipment', 'DELETE', undefined, id)
}

export function updateIncident(id: number, incident: Omit<Incident, 'id'>) {
  return adminRequest<Incident>('incident', 'PATCH', incident, id)
}

export function deleteIncident(id: number) {
  return adminRequest<{ deleted: true }>('incident', 'DELETE', undefined, id)
}
