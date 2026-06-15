// Notifications du client
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface Notif { id: string; message: string; read: boolean; createdAt: string }

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        if (!data.linkedCustomerId) {
          setError('Aucun profil client n\'est encore associé à votre compte.')
          return
        }
        return api.get('/customers/notifications', { params: { customerId: data.linkedCustomerId } })
          .then((r) => setNotifs(r.data))
      })
      .catch(() => setError('Impossible de charger les notifications.'))
      .finally(() => setLoading(false))
  }, [])

  async function markRead(id: string) {
    try {
      await api.put(`/customers/notifications/${id}/read`)
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch {
      // ignore
    }
  }

  if (loading) return <p className="text-slate-400 text-sm">Chargement...</p>

  if (error) {
    return (
      <Card title="Mes notifications">
        <p className="text-slate-400 text-sm text-center py-4">{error}</p>
      </Card>
    )
  }

  return (
    <Card title="Mes notifications">
      <ul className="space-y-3">
        {notifs.map((n) => (
          <li
            key={n.id}
            onClick={() => !n.read && markRead(n.id)}
            className={`p-3 rounded-lg text-sm cursor-pointer ${n.read ? 'bg-slate-50 text-slate-500' : 'bg-blue-50 text-slate-800 font-medium'}`}
          >
            <p>{n.message}</p>
            <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
          </li>
        ))}
        {notifs.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Aucune notification.</p>}
      </ul>
    </Card>
  )
}
