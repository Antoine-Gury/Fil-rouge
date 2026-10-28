const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export async function request<T>(resource: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/${resource}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new Error(`Impossible de joindre l’API (${API_BASE_URL}). Vérifiez que json-server est démarré.`)
  }

  if (!response.ok) {
    throw new Error(`L’API a répondu avec une erreur (${response.status} ${response.statusText}).`)
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }

  return response.json() as Promise<T>
}
