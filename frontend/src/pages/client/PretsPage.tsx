// Prêts client : voir ses demandes + demander un nouveau prêt
import { useEffect, useState, FormEvent } from 'react'
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
  decisionReason?: string
}

export default function PretsPage() {
  const [loans, setLoans] = useState<LoanApplication[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchLoans = (custId: string) =>
    api.get('/loans', { params: { customerId: custId } }).then((r) => setLoans(r.data))

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        if (!data.linkedCustomerId) {
          setError('Aucun profil client n\'est encore associé à votre compte.')
          return
        }
        setCustomerId(data.linkedCustomerId)
        return fetchLoans(data.linkedCustomerId)
      })
      .catch(() => setError('Impossible de charger vos prêts.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg(''); setError('')
    if (!customerId) return
    try {
      await api.post('/loans', { customerId, requestedAmount: Number(amount), purpose })
      setMsg('Demande soumise avec succès.')
      setAmount(''); setPurpose('')
      fetchLoans(customerId)
    } catch (err: any) {
      setError(parseError(err, 'Impossible de soumettre la demande.'))
    }
  }

  const statusColor: Record<string, string> = {
    SUBMITTED: 'bg-yellow-100 text-yellow-700',
    UNDER_REVIEW: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <Card title="Demander un prêt" className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Montant demandé (FCFA)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Objet du prêt</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!customerId}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Soumettre
          </button>
        </form>
      </Card>

      <Card title="Mes demandes de prêt">
        {loading ? <p className="text-slate-400 text-sm">Chargement...</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b">
                <th className="pb-2">Montant</th>
                <th className="pb-2">Objet</th>
                <th className="pb-2">Statut</th>
                <th className="pb-2">Soumis le</th>
                <th className="pb-2">Motif décision</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-2">{l.requestedAmount.toLocaleString('fr-FR')} FCFA</td>
                  <td className="py-2 text-slate-500">{l.purpose}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[l.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-2 text-slate-400 text-xs">{new Date(l.submittedAt).toLocaleDateString('fr-FR')}</td>
                  <td className="py-2 text-slate-500 text-xs">{l.decisionReason ?? '—'}</td>
                </tr>
              ))}
              {loans.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-slate-400 text-center">Aucune demande de prêt.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
