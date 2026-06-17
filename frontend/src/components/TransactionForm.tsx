// Formulaire générique de transaction
import { useState, useEffect, FormEvent } from 'react'
import api from '../api/axios'
import Card from '../components/Card'

interface Field { name: string; label: string; type?: string; options?: { value: string; label: string }[]; defaultValue?: string }

interface Props {
  title: string
  endpoint: string
  fields: Field[]
}

export default function TransactionForm({ title, endpoint, fields }: Props) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // When options load for a select field, pre-select the first real option
  useEffect(() => {
    const updates: Record<string, string> = {}
    fields.forEach((f) => {
      if (f.options && f.options.length > 0) {
        const firstReal = f.options.find((o) => o.value !== '')
        if (firstReal && !form[f.name]) {
          updates[f.name] = firstReal.value
        }
      } else if (f.defaultValue !== undefined && !form[f.name]) {
        updates[f.name] = f.defaultValue
      }
    })
    if (Object.keys(updates).length > 0) setForm((prev) => ({ ...prev, ...updates }))
  }, [fields])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg(''); setError('')
    setLoading(true)
    try {
      const payload = { ...form }
      fields.forEach((f) => {
        if (f.defaultValue !== undefined && payload[f.name] === undefined) {
          payload[f.name] = f.defaultValue
        }
      })
      await api.post(endpoint, payload)
      setMsg('Opération effectuée avec succès.')
      setForm({})
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de l\'opération.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={title} className="max-w-md">
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
        {msg && <p className="text-green-600 text-sm">{msg}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Envoi...' : 'Valider'}
        </button>
      </form>
    </Card>
  )
}
