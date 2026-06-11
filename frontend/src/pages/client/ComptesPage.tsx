// Espace client : liste des comptes
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface Account { id: string; accountNumber: string; balance: number; type: string }

export default function ComptesPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/accounts').then((r) => setAccounts(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <Card title="Mes comptes">
      {loading ? <p className="text-slate-400 text-sm">Chargement...</p> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="pb-2">Numéro</th>
              <th className="pb-2">Type</th>
              <th className="pb-2 text-right">Solde (FCFA)</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="py-2 font-mono">{a.accountNumber}</td>
                <td className="py-2 text-slate-500">{a.type}</td>
                <td className="py-2 text-right font-semibold text-slate-800">
                  {a.balance.toLocaleString('fr-FR')}
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-slate-400 text-center">Aucun compte trouvé.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </Card>
  )
}
