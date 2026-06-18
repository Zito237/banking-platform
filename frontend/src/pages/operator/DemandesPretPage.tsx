// Opérateur : liste des demandes de prêt + décision approuver/rejeter
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'
import { parseError } from '../../api/parseError'

interface LoanApplication {
  id: string
  customerId: string
  requestedAmount: number
  purpose: string
  status: string
  submittedAt: string
}

export default function DemandesPretPage() {
  const [loans, setLoans] = useState<LoanApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [rates, setRates] = useState<Record<string, string>>({})
  const [terms, setTerms] = useState<Record<string, string>>({})
  const [decisionError, setDecisionError] = useState<Record<string, string>>({})

  const fetchLoans = () =>
    api.get('/loans', { params: { status: 'SUBMITTED' } })
      .then((r) => setLoans(r.data))
      .catch(() => setError('Impossible de charger les demandes de prêt.'))
      .finally(() => setLoading(false))

  useEffect(() => { fetchLoans() }, [])

  async function decide(id: string, approved: boolean) {
    const reason = reasons[id]?.trim()
    if (!reason) {
      setDecisionError({ ...decisionError, [id]: 'Un motif est obligatoire.' })
      return
    }
    setDecisionError({ ...decisionError, [id]: '' })
    try {
      await api.post(`/loans/${id}/decision`, {
        approved,
        reason,
        interestRate: rates[id] ? Number(rates[id]) : undefined,
        termMonths: terms[id] ? Number(terms[id]) : undefined,
      })
      fetchLoans()
    } catch (err: any) {
      const message = err.response?.data?.message
      setDecisionError({ ...decisionError, [id]: parseError(err, "Impossible d'enregistrer la décision.") })
    }
  }

  return (
    <Card title="Demandes de prêt en attente">
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {loading ? <p className="text-slate-400 text-sm">Chargement...</p> : (
        <div className="space-y-4">
          {loans.map((l) => (
            <div key={l.id} className="border border-slate-100 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-800">{l.requestedAmount.toLocaleString('fr-FR')} FCFA — {l.purpose}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">Client : {l.customerId}</p>
                  <p className="text-xs text-slate-400">Soumis le {new Date(l.submittedAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  placeholder="Motif (obligatoire)"
                  value={reasons[l.id] ?? ''}
                  onChange={(e) => setReasons({ ...reasons, [l.id]: e.target.value })}
                  className="col-span-3 sm:col-span-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Taux annuel (ex: 0.12)"
                  value={rates[l.id] ?? ''}
                  onChange={(e) => setRates({ ...rates, [l.id]: e.target.value })}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Durée (mois)"
                  value={terms[l.id] ?? ''}
                  onChange={(e) => setTerms({ ...terms, [l.id]: e.target.value })}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {decisionError[l.id] && <p className="text-red-500 text-xs">{decisionError[l.id]}</p>}
              <div className="space-x-2">
                <button
                  onClick={() => decide(l.id, true)}
                  className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition"
                >
                  Approuver
                </button>
                <button
                  onClick={() => decide(l.id, false)}
                  className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition"
                >
                  Rejeter
                </button>
              </div>
            </div>
          ))}
          {loans.length === 0 && (
            <p className="py-4 text-slate-400 text-center text-sm">Aucune demande en attente.</p>
          )}
        </div>
      )}
    </Card>
  )
}
