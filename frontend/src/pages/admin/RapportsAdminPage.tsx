// Admin : rapports globaux
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface Stats { totalClients: number; totalLoans: number; totalTransactions: number; totalAmount: number }

export default function RapportsAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.get('/reports/global').then((r) => setStats(r.data)).catch(() => setStats(null))
  }, [])

  const items = stats ? [
    { label: 'Clients', value: stats.totalClients },
    { label: 'Prêts', value: stats.totalLoans },
    { label: 'Transactions', value: stats.totalTransactions },
    { label: 'Volume total (FCFA)', value: stats.totalAmount?.toLocaleString('fr-FR') },
  ] : []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {items.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
          </div>
        ))}
      </div>
      {!stats && (
        <Card title="Rapports globaux">
          <p className="text-slate-400 text-sm text-center py-4">Données non disponibles.</p>
        </Card>
      )}
    </div>
  )
}
