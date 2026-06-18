// Espace client : création du profil client (KYC) et ouverture de compte
import { useEffect, useState, FormEvent } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface Operator { id: string; name: string; code: string }
interface Customer { id: string; firstName: string; lastName: string; email: string; kycStatus: string; operatorId: string }
interface Account { id: string; accountNumber: string; accountType: string; balance: number; currency: string }

const ACCOUNT_TYPES = ['CURRENT', 'SAVINGS', 'WALLET']

export default function ProfilPage() {
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  // Formulaire de création de profil
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', email: '', phone: '',
    address: '', nationalIdNumber: '', operatorId: '',
  })

  // Formulaire d'ouverture de compte
  const [accountType, setAccountType] = useState(ACCOUNT_TYPES[0])
  const [currency, setCurrency] = useState('XAF')

  function load() {
    setLoading(true)
    api.get('/auth/me')
      .then(({ data }) => {
        setCustomerId(data.linkedCustomerId ?? null)
        if (data.linkedCustomerId) {
          return Promise.all([
            api.get(`/customers/${data.linkedCustomerId}`),
            api.get('/accounts', { params: { customerId: data.linkedCustomerId } }),
          ]).then(([c, a]) => {
            setCustomer(c.data)
            setAccounts(a.data)
          })
        }
        return api.get('/operators').then((r) => setOperators(r.data))
      })
      .catch(() => setError('Impossible de charger votre profil.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleCreateProfile(e: FormEvent) {
    e.preventDefault()
    setMsg(''); setError('')
    try {
      const { data } = await api.post('/customers', form)
      await api.put('/auth/me/link-customer', { customerId: data.id })
      setMsg('Profil créé et associé avec succès.')
      load()
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(typeof message === 'string' ? message : 'Impossible de créer le profil.')
    }
  }

  async function handleOpenAccount(e: FormEvent) {
    e.preventDefault()
    setMsg(''); setError('')
    if (!customer) return
    try {
      await api.post('/accounts', {
        customerId: customer.id,
        operatorId: customer.operatorId,
        accountType,
        currency,
      })
      setMsg('Compte ouvert avec succès.')
      load()
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(typeof message === 'string' ? message : "Impossible d'ouvrir le compte.")
    }
  }

  if (loading) return <p className="text-slate-400 text-sm">Chargement...</p>

  if (!customerId) {
    return (
      <Card title="Créer mon profil client" className="max-w-md">
        <form onSubmit={handleCreateProfile} className="space-y-4">
          {[
            { key: 'firstName', label: 'Prénom' },
            { key: 'lastName', label: 'Nom' },
            { key: 'dateOfBirth', label: 'Date de naissance (AAAA-MM-JJ)' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Téléphone' },
            { key: 'address', label: 'Adresse' },
            { key: 'nationalIdNumber', label: "Numéro d'identité" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                required
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Opérateur</label>
            <select
              required
              value={form.operatorId}
              onChange={(e) => setForm({ ...form, operatorId: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner...</option>
              {operators.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
            </select>
          </div>
          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
            Créer mon profil
          </button>
        </form>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card title="Mon profil">
        {customer && (
          <div className="text-sm space-y-1">
            <p><span className="text-slate-400">Nom :</span> {customer.firstName} {customer.lastName}</p>
            <p><span className="text-slate-400">Email :</span> {customer.email}</p>
            <p><span className="text-slate-400">Statut KYC :</span> {customer.kycStatus}</p>
          </div>
        )}
      </Card>

      <Card title="Ouvrir un nouveau compte" className="max-w-md">
        <form onSubmit={handleOpenAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type de compte</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Devise</label>
            <input
              required
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
            Ouvrir le compte
          </button>
        </form>
      </Card>

      <Card title="Mes comptes">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="pb-2">Numéro</th>
              <th className="pb-2">Type</th>
              <th className="pb-2 text-right">Solde</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="py-2 font-mono">{a.accountNumber}</td>
                <td className="py-2 text-slate-500">{a.accountType}</td>
                <td className="py-2 text-right font-semibold text-slate-800">{a.balance.toLocaleString('fr-FR')} {a.currency}</td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-slate-400 text-center">Aucun compte.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
