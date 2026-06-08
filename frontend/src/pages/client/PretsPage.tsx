// Prêts client : voir ses prêts + demander un nouveau
import { useEffect, useState, FormEvent } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface Loan { id: string; amount: number; status: string; duration: number }

export default function PretsPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [amount, setAmount] = useState('')
  const [duration, setDuration] = useState('')
  const [purpose, setPurpose] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/loans').then((r) => setLoans(r.data))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    await api.post('/loans', { amount: Number(amount), duration: Number(duration), purpose })
    setMsg('Demande soumise avec succès.')
    setAmount(''); setDuration(''); setPurpose('')
    api.get('/loans').then((r) => setLoans(r.data))
  }

  const statusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <Card title="Demander un prêt" className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Montant (FCFA)', val: amount, set: setAmount, type: 'number' },
            { label: 'Durée (mois)', val: duration, set: setDuration, type: 'number' },
            { label: 'Objet du prêt', val: purpose, set: setPurpose, type: 'text' },
          ].map(({ label, val, set, type }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type={type}
                required
                value={val}
                onChange={(e) => set(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
            Soumettre
          </button>
        </form>
      </Card>

      <Card title="Mes prêts">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="pb-2">ID</th>
              <th className="pb-2">Montant</th>
              <th className="pb-2">Durée</th>
              <th className="pb-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="py-2 font-mono text-xs">{l.id}</td>
                <td className="py-2">{l.amount.toLocaleString('fr-FR')} FCFA</td>
                <td className="py-2">{l.duration} mois</td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[l.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
            {loans.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-slate-400 text-center">Aucun prêt.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
