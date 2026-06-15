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
// Le claim "roles" est une chaîne unique (ex: "CLIENT" ou "CLIENT,ADMIN")
function parseJwt(token: string): { role?: string; sub?: string; roles?: string } {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}

function extractRole(payload: { role?: string; roles?: string }): string {
  return payload.role ?? payload.roles?.split(',')[0] ?? ''
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = localStorage.getItem('token')
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (!stored) return null
    const payload = parseJwt(stored)
    return { token: stored, role: extractRole(payload), username: payload.sub ?? '' }
  })

  function login(token: string) {
    localStorage.setItem('token', token)
    const payload = parseJwt(token)
    setUser({ token, role: extractRole(payload), username: payload.sub ?? '' })
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
