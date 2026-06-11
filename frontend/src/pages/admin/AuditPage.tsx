// Admin : journal d'audit
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface AuditEntry { id: string; action: string; userId: string; timestamp: string; details: string }

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])

  useEffect(() => {
    api.get('/audit').then((r) => setEntries(r.data)).catch(() => setEntries([]))
  }, [])

  return (
    <Card title="Journal d'audit">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b">
            <th className="pb-2">Date</th>
            <th className="pb-2">Utilisateur</th>
            <th className="pb-2">Action</th>
            <th className="pb-2">Détails</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b last:border-0">
              <td className="py-2 text-slate-400 text-xs">{new Date(e.timestamp).toLocaleString('fr-FR')}</td>
              <td className="py-2 font-mono text-xs">{e.userId}</td>
              <td className="py-2 font-medium">{e.action}</td>
              <td className="py-2 text-slate-500 text-xs">{e.details}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={4} className="py-4 text-slate-400 text-center">Aucune entrée d'audit.</td></tr>
          )}
        </tbody>
      </table>
    </Card>
  )
}
