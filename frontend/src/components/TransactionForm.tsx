import { useState, useEffect, FormEvent } from 'react'
import api from '../api/axios'
import Card from '../components/Card'
import { parseError } from '../api/parseError'

interface Field {
  name: string
  label: string
  type?: string
  options?: { value: string; label: string }[]
  defaultValue?: string
}

interface Props {
  title: string
  endpoint: string
  fields: Field[]
  onSuccess?: () => void
}

interface TxResult {
  reference: string
  amount: number
  currency: string
  fees: number
  sourceAccountId?: string
  newBalance?: number
}

export default function TransactionForm({ title, endpoint, fields, onSuccess }: Props) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [result, setResult] = useState<TxResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const updates: Record<string, string> = {}
    fields.forEach((f) => {
      if (f.options && f.options.length > 0) {
        const firstReal = f.options.find((o) => o.value !== '')
        if (firstReal && !form[f.name]) updates[f.name] = firstReal.value
      } else if (f.defaultValue !== undefined && !form[f.name]) {
        updates[f.name] = f.defaultValue
      }
    })
    if (Object.keys(updates).length > 0) setForm((prev) => ({ ...prev, ...updates }))
  }, [fields])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setResult(null); setError('')
    setLoading(true)
    try {
      const payload = { ...form }
      fields.forEach((f) => {
        if (f.defaultValue !== undefined && payload[f.name] === undefined)
          payload[f.name] = f.defaultValue
      })
      const { data } = await api.post(endpoint, payload)

      const tx: TxResult = {
        reference:       data.reference,
        amount:          data.amount,
        currency:        data.currency ?? 'XAF',
        fees:            data.fees ?? 0,
        sourceAccountId: data.sourceAccountId,
      }

      // Récupère le nouveau solde si on a un sourceAccountId
      if (data.sourceAccountId) {
        try {
          const acct = await api.get(`/accounts/${data.sourceAccountId}`)
          tx.newBalance = acct.data.balance
          tx.currency   = acct.data.currency ?? tx.currency
        } catch { /* non bloquant */ }
      }

      setResult(tx)
      setForm({})
      onSuccess?.()
    } catch (err: any) {
      setError(parseError(err, "Erreur lors de l'opération."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={title} className="max-w-md">
      {result ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-2 text-sm">
            <p className="font-semibold text-green-700">✓ Opération réussie</p>
            <div className="text-slate-600 space-y-1">
              <p><span className="text-slate-400">Référence :</span> <span className="font-mono">{result.reference}</span></p>
              <p><span className="text-slate-400">Montant :</span> {Number(result.amount).toLocaleString('fr-FR')} {result.currency}</p>
              {result.fees > 0 && (
                <p><span className="text-slate-400">Frais :</span> {Number(result.fees).toLocaleString('fr-FR')} {result.currency}</p>
              )}
              {result.newBalance !== undefined && (
                <p className="pt-1 border-t border-green-200">
                  <span className="text-slate-400">Nouveau solde :</span>{' '}
                  <span className="font-bold text-slate-800">{Number(result.newBalance).toLocaleString('fr-FR')} {result.currency}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setResult(null)}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition"
          >
            Nouvelle opération
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
              {f.options ? (
                <select
                  required
                  value={form[f.name] ?? f.defaultValue ?? ''}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type ?? 'text'}
                  required={!f.label.includes('optionnel')}
                  value={form[f.name] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Envoi...' : 'Valider'}
          </button>
        </form>
      )}
    </Card>
  )
}
