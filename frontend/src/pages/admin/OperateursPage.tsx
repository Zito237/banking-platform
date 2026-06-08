// Admin : gestion des opérateurs
import { useEffect, useState, FormEvent } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface Operator { id: string; username: string; email: string; active: boolean }

export default function OperateursPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const fetch = () => api.get('/operators').then((r) => setOperators(r.data))
  useEffect(() => { fetch() }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    await api.post('/operators', { username, email, password })
    setMsg('Opérateur créé.')
    setUsername(''); setEmail(''); setPassword('')
    fetch()
  }

  async function toggleActive(op: Operator) {
    await api.patch(`/operators/${op.id}`, { active: !op.active })
    fetch()
  }

  return (
    <div className="space-y-6">
      <Card title="Créer un opérateur" className="max-w-md">
        <form onSubmit={handleCreate} className="space-y-4">
          {[
            { label: "Nom d'utilisateur", val: username, set: setUsername },
            { label: 'Email', val: email, set: setEmail },
            { label: 'Mot de passe', val: password, set: setPassword },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                required
                value={val}
                onChange={(e) => set(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
            Créer
          </button>
        </form>
      </Card>

      <Card title="Liste des opérateurs">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="pb-2">Nom</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Statut</th>
              <th className="pb-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {operators.map((op) => (
              <tr key={op.id} className="border-b last:border-0">
                <td className="py-2">{op.username}</td>
                <td className="py-2 text-slate-500">{op.email}</td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${op.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {op.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="py-2">
                  <button
                    onClick={() => toggleActive(op)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {op.active ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
            {operators.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-slate-400 text-center">Aucun opérateur.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
