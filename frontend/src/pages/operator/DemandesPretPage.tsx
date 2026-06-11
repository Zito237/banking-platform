// Opérateur : liste des demandes de prêt + décision approuver/rejeter
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface Loan { id: string; customerId: string; amount: number; duration: number; purpose: string; status: string }

export default function DemandesPretPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = () => api.get('/loans?status=PENDING').then((r) => setLoans(r.data)).finally(() => setLoading(false))
  useEffect(() => { fetch() }, [])

  async function decide(id: string, decision: 'APPROVED' | 'REJECTED') {
    await api.post(`/loans/${id}/decision`, { decision })
    fetch()
  }

  return (
    <Card title="Demandes de prêt en attente">
      {loading ? <p className="text-slate-400 text-sm">Chargement...</p> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="pb-2">Client</th>
              <th className="pb-2">Montant</th>
              <th className="pb-2">Durée</th>
              <th className="pb-2">Objet</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="py-2 font-mono text-xs">{l.customerId}</td>
                <td className="py-2">{l.amount.toLocaleString('fr-FR')} FCFA</td>
                <td className="py-2">{l.duration} mois</td>
                <td className="py-2 text-slate-500">{l.purpose}</td>
                <td className="py-2 space-x-2">
                  <button
                    onClick={() => decide(l.id, 'APPROVED')}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => decide(l.id, 'REJECTED')}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg hover:bg-red-200 transition"
                  >
                    Rejeter
                  </button>
                </td>
              </tr>
            ))}
            {loans.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-slate-400 text-center">Aucune demande en attente.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </Card>
  )
}
