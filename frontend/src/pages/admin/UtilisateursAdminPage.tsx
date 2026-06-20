import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface UserInfo {
  id: string
  username: string
  email: string
  enabled: boolean
  roles: string[]
  operatorId?: string
  linkedCustomerId?: string
}

const ROLE_STYLE: Record<string, { label: string; classes: string }> = {
  ADMIN:    { label: 'Admin',    classes: 'bg-purple-100 text-purple-700' },
  OPERATOR: { label: 'Opérateur',classes: 'bg-blue-100   text-blue-700'  },
  CLIENT:   { label: 'Client',   classes: 'bg-slate-100  text-slate-600'  },
}

type RoleFilter = 'ALL' | 'ADMIN' | 'OPERATOR' | 'CLIENT'

export default function UtilisateursAdminPage() {
  const [users, setUsers]       = useState<UserInfo[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState<RoleFilter>('ALL')
  const [toggling, setToggling] = useState<Record<string, boolean>>({})

  const fetchUsers = () => {
    setLoading(true); setError('')
    api.get('/auth/users')
      .then((r) => setUsers(r.data))
      .catch(() => setError('Impossible de charger la liste des utilisateurs.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  async function toggleEnabled(user: UserInfo) {
    setToggling((p) => ({ ...p, [user.id]: true }))
    try {
      await api.patch(`/auth/users/${user.id}/enabled`)
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, enabled: !u.enabled } : u)
      )
    } catch {
      setError(`Impossible de modifier le statut de ${user.username}.`)
    } finally {
      setToggling((p) => ({ ...p, [user.id]: false }))
    }
  }

  const tabs: { key: RoleFilter; label: string }[] = [
    { key: 'ALL',      label: 'Tous'        },
    { key: 'ADMIN',    label: 'Admins'      },
    { key: 'OPERATOR', label: 'Opérateurs'  },
    { key: 'CLIENT',   label: 'Clients'     },
  ]

  const filtered = users.filter((u) =>
    filter === 'ALL' ? true : u.roles.includes(filter)
  )

  const counts = {
    ALL:      users.length,
    ADMIN:    users.filter((u) => u.roles.includes('ADMIN')).length,
    OPERATOR: users.filter((u) => u.roles.includes('OPERATOR')).length,
    CLIENT:   users.filter((u) => u.roles.includes('CLIENT')).length,
  }

  return (
    <Card title="Gestion des utilisateurs">
      {/* Onglets filtre */}
      <div className="flex gap-1 mb-4 border-b border-slate-100 pb-3">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === t.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {t.label}
            <span className="ml-1.5 text-[11px] opacity-70">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-slate-400 text-sm">Chargement...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b text-xs">
              <th className="pb-2 pr-3">Utilisateur</th>
              <th className="pb-2 pr-3">Email</th>
              <th className="pb-2 pr-3">Rôle(s)</th>
              <th className="pb-2 pr-3">Statut</th>
              <th className="pb-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className={`border-b last:border-0 ${!u.enabled ? 'opacity-50' : ''}`}>
                <td className="py-2 pr-3">
                  <p className="font-medium text-slate-800">{u.username}</p>
                  {u.operatorId && (
                    <p className="text-[10px] text-slate-400">Op: {u.operatorId.slice(0, 8)}…</p>
                  )}
                </td>
                <td className="py-2 pr-3 text-slate-500 text-xs">{u.email}</td>
                <td className="py-2 pr-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((role) => {
                      const s = ROLE_STYLE[role] ?? { label: role, classes: 'bg-slate-100 text-slate-600' }
                      return (
                        <span key={role} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${s.classes}`}>
                          {s.label}
                        </span>
                      )
                    })}
                  </div>
                </td>
                <td className="py-2 pr-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {u.enabled ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
                <td className="py-2">
                  {!u.roles.includes('ADMIN') && (
                    <button
                      onClick={() => toggleEnabled(u)}
                      disabled={toggling[u.id]}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition disabled:opacity-50 ${
                        u.enabled
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}>
                      {toggling[u.id] ? '...' : u.enabled ? 'Désactiver' : 'Activer'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-slate-400 text-center text-sm">
                  Aucun utilisateur dans cette catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </Card>
  )
}
