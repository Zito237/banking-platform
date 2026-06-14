// Admin : gestion des opérateurs
import { useEffect, useState, FormEvent } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface BusinessRule { id: string; ruleType: string; value: string }
interface Operator { id: string; name: string; code: string; country: string; status: string; rules: BusinessRule[] }

export default function OperateursPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [country, setCountry] = useState('')
  const [commissionRate, setCommissionRate] = useState('')
  const [ceiling, setCeiling] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchOperators = () =>
    api.get('/operators')
      .then((r) => setOperators(r.data))
      .catch(() => setError('Impossible de charger la liste des opérateurs.'))
      .finally(() => setLoading(false))

  useEffect(() => { fetchOperators() }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      const rules = [
        { ruleType: 'COMMISSION', value: commissionRate },
        { ruleType: 'CEILING', value: ceiling },
      ]
      await api.post('/operators', { name, code, country, rules })
      setMsg('Opérateur créé.')
      setName(''); setCode(''); setCountry(''); setCommissionRate(''); setCeiling('')
      fetchOperators()
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(typeof message === 'string' ? message : "Impossible de créer l'opérateur.")
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Créer un opérateur" className="max-w-md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pays</label>
            <input
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Taux de commission (ex: 1.5%)</label>
            <input
              required
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="1.5%"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plafond de transaction (ex: 500000)</label>
            <input
              required
              value={ceiling}
              onChange={(e) => setCeiling(e.target.value)}
              placeholder="500000"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
            Créer
          </button>
        </form>
      </Card>

      <Card title="Liste des opérateurs">
        {loading ? <p className="text-slate-400 text-sm">Chargement...</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b">
                <th className="pb-2">Nom</th>
                <th className="pb-2">Code</th>
                <th className="pb-2">Pays</th>
                <th className="pb-2">Statut</th>
                <th className="pb-2">Règles</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((op) => (
                <tr key={op.id} className="border-b last:border-0">
                  <td className="py-2">{op.name}</td>
                  <td className="py-2 text-slate-500 font-mono">{op.code}</td>
                  <td className="py-2 text-slate-500">{op.country}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${op.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {op.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="py-2 text-slate-500">
                    {(op.rules ?? []).map((r) => `${r.ruleType}: ${r.value}`).join(', ')}
                  </td>
                </tr>
              ))}
              {operators.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-slate-400 text-center">Aucun opérateur.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
