// Notifications du client
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface Notif { id: string; message: string; read: boolean; createdAt: string }

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([])

  useEffect(() => {
    api.get('/customers/notifications').then((r) => setNotifs(r.data))
  }, [])

  return (
    <Card title="Mes notifications">
      <ul className="space-y-3">
        {notifs.map((n) => (
          <li key={n.id} className={`p-3 rounded-lg text-sm ${n.read ? 'bg-slate-50 text-slate-500' : 'bg-blue-50 text-slate-800 font-medium'}`}>
            <p>{n.message}</p>
            <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
          </li>
        ))}
        {notifs.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Aucune notification.</p>}
      </ul>
    </Card>
  )
}
