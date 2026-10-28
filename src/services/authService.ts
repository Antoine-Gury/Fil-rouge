export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'operator' | 'viewer'
}

class AuthApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthApiError'
  }
}

async function authRequest(action: string, body?: Record<string, string>): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`/api/auth.php?action=${action}`, {
      method: body ? 'POST' : 'GET',
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Impossible de joindre le serveur PHP. Vérifiez qu’il est démarré sur le port 8000.')
  }

  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'message' in result && typeof result.message === 'string'
      ? result.message
      : `Le serveur a répondu avec une erreur (${response.status}).`
    throw new AuthApiError(message)
  }
  return result
}

function parseUserResponse(result: unknown, nullable = false): AuthUser | null {
  if (typeof result !== 'object' || result === null || !('user' in result)) {
    throw new Error('La réponse du serveur d’authentification est invalide.')
  }
  const user = result.user
  if (user === null && nullable) return null
  if (
    typeof user !== 'object'
    || user === null
    || !('id' in user)
    || typeof user.id !== 'number'
    || !('name' in user)
    || typeof user.name !== 'string'
    || !('email' in user)
    || typeof user.email !== 'string'
    || !('role' in user)
    || (user.role !== 'admin' && user.role !== 'operator' && user.role !== 'viewer')
  ) {
    throw new Error('Les informations du compte reçues du serveur sont invalides.')
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

export async function getCurrentUser() {
  return parseUserResponse(await authRequest('me'), true)
}

export async function login(email: string, password: string) {
  return parseUserResponse(await authRequest('login', { email, password }))
}

export async function register(name: string, email: string, password: string) {
  return parseUserResponse(await authRequest('register', { name, email, password }))
}

export async function logout() {
  parseUserResponse(await authRequest('logout', {}), true)
}
