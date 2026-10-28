import type { User } from '../types'

export async function getUsers(): Promise<User[]> {
  let response: Response
  try {
    response = await fetch('/api/auth.php?action=directory', { credentials: 'same-origin' })
  } catch {
    throw new Error('Impossible de joindre le serveur des comptes.')
  }

  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'message' in result && typeof result.message === 'string'
      ? result.message
      : `Le serveur des comptes a répondu avec une erreur (${response.status}).`
    throw new Error(message)
  }
  if (typeof result !== 'object' || result === null || !('users' in result) || !Array.isArray(result.users)) {
    throw new Error('La réponse du serveur des comptes est invalide.')
  }
  return result.users as User[]
}
