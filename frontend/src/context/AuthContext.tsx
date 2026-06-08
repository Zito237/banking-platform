// Contexte d'authentification : gestion du token JWT et du rôle utilisateur
import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthUser {
  token: string
  role: string   // CLIENT | OPERATOR | ADMIN
  username: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>(null!)

// Décode le payload d'un JWT (base64)
function parseJwt(token: string): { role?: string; sub?: string; roles?: string[] } {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = localStorage.getItem('token')
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (!stored) return null
    const payload = parseJwt(stored)
    const role = payload.role ?? payload.roles?.[0] ?? ''
    return { token: stored, role, username: payload.sub ?? '' }
  })

  function login(token: string) {
    localStorage.setItem('token', token)
    const payload = parseJwt(token)
    const role = payload.role ?? payload.roles?.[0] ?? ''
    setUser({ token, role, username: payload.sub ?? '' })
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
