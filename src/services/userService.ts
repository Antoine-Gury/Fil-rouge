import { request } from './api'
import type { User } from '../types'

export function getUsers() {
  return request<User[]>('users')
}
