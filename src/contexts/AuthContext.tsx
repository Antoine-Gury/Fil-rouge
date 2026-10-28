import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type AuthUser,
} from '../services/authService'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  initializationError: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializationError, setInitializationError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch((reason: unknown) => {
        if (active) {
          setInitializationError(reason instanceof Error ? reason.message : 'Impossible de vérifier la session.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  async function login(email: string, password: string) {
    setInitializationError(null)
    setUser(await loginRequest(email, password))
  }

  async function register(name: string, email: string, password: string) {
    setInitializationError(null)
    setUser(await registerRequest(name, email, password))
  }

  async function logout() {
    try {
      await logoutRequest()
      setUser(null)
      setInitializationError(null)
    } catch (reason) {
      setInitializationError(reason instanceof Error ? reason.message : 'La déconnexion a échoué.')
      throw reason
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, initializationError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider.')
  return context
}
