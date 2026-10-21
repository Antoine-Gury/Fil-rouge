import { request } from './api'
import type { NewUser, User } from '../types'

export function getUsers() {
  return request<User[]>('users')
}

export function createUser(user: NewUser) {
  return request<User>('users', {
    method: 'POST',
    body: JSON.stringify(user),
  })
}

export function updateUser(id: number, user: NewUser) {
  return request<User>(`users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(user),
  })
}

export function deleteUser(id: number) {
  return request<void>(`users/${id}`, { method: 'DELETE' })
}
