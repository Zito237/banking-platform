import { useEffect, useState, FormEvent } from 'react'
import api from '../../api/axios'
import { parseError } from '../../api/parseError'
import Card from '../../components/Card'

interface Operator { id: string; name: string; code: string }

interface Customer {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  email: string
  phone: string
  address: string
  nationalIdNumber: string
  operatorId: string
  kycStatus: string
  createdAt: string
}

interface Account {
  id: string
  accountNumber: string
  accountType: string
  balance: number
  currency: string
}

const ACCOUNT_TYPES = ['CURRENT', 'SAVINGS', 'WALLET']

const KYC_LABEL: Record<string, { label: string; classes: string }> = {
  PENDING:  { label: 'En attente',  classes: 'bg-yellow-100 text-yellow-800' },
  VERIFIED: { label: 'Vérifié',     classes: 'bg-green-100  text-green-800'  },
  REJECTED: { label: 'Rejeté',      classes: 'bg-red-100    text-red-800'    },
}

function KycBadge({ status }: { status: string }) {
  const { label, classes } = KYC_LABEL[status] ?? { label: status, classes: 'bg-slate-100 text-slate-700' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}

export default function ProfilPage() {
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  // Formulaire de création de profil
  const [createForm, setCreateForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', email: '', phone: '',
    address: '', nationalIdNumber: '', operatorId: '',
  })

  // Formulaire de modification du profil
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', phone: '', address: '',
  })

  // Formulaire d'ouverture de compte
  const [accountType, setAccountType] = useState(ACCOUNT_TYPES[0])
  const [currency, setCurrency] = useState('XAF')
  const [accountOperatorId, setAccountOperatorId] = useState('')

  function load() {
    setLoading(true)
    api.get('/auth/me')
      .then(({ data }) => {
        setCustomerId(data.linkedCustomerId ?? null)
        if (data.linkedCustomerId) {
          return Promise.all([
            api.get(`/customers/${data.linkedCustomerId}`),
            api.get('/accounts', { params: { customerId: data.linkedCustomerId } }),
            api.get('/operators'),
          ]).then(([c, a, o]) => {
            setCustomer(c.data)
            setAccounts(a.data)
            setOperators(o.data)
          })
        }
        return api.get('/operators').then((r) => setOperators(r.data))
      })
      .catch(() => setError('Impossible de charger votre profil.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openEdit() {
    if (!customer) return
    setEditForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      dateOfBirth: customer.dateOfBirth ?? '',
      phone: customer.phone ?? '',
      address: customer.address ?? '',
    })
    setEditMode(true)
    setMsg(''); setError('')
  }

  async function handleCreateProfile(e: FormEvent) {
    e.preventDefault()
    setMsg(''); setError('')
    try {
      const { data } = await api.post('/customers', createForm)
      await api.put('/auth/me/link-customer', { customerId: data.id })
      setMsg('Profil créé et associé avec succès.')
      load()
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(typeof message === 'string' ? message : 'Impossible de créer le profil.')
    }
  }

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault()
    if (!customer) return
    setMsg(''); setError('')
    try {
      const { data } = await api.put(`/customers/${customer.id}`, editForm)
      setCustomer(data)
      setEditMode(false)
      setMsg('Profil mis à jour avec succès.')
    } catch (err: any) {
      setError(parseError(err, 'Impossible de mettre à jour le profil.'))
    }
  }

  async function handleOpenAccount(e: FormEvent) {
    e.preventDefault()
    setMsg(''); setError('')
    if (!customer) return
    try {
      await api.post('/accounts', {
        customerId: customer.id,
        operatorId: accountOperatorId || customer.operatorId,
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
          {([
            { key: 'firstName',      label: 'Prénom',              type: 'text' },
            { key: 'lastName',       label: 'Nom',                  type: 'text' },
            { key: 'dateOfBirth',    label: 'Date de naissance',    type: 'date' },
            { key: 'email',          label: 'Email',                type: 'email' },
            { key: 'phone',          label: 'Téléphone',            type: 'tel' },
            { key: 'address',        label: 'Adresse',              type: 'text' },
            { key: 'nationalIdNumber', label: "Numéro d'identité", type: 'text' },
          ] as { key: keyof typeof createForm; label: string; type: string }[]).map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                required
                type={type}
                value={createForm[key]}
                onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Opérateur</label>
            <select
              required
              value={createForm.operatorId}
              onChange={(e) => setCreateForm({ ...createForm, operatorId: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un opérateur...</option>
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

  const operatorName = operators.find((o) => o.id === customer?.operatorId)?.name ?? customer?.operatorId

  return (
    <div className="space-y-6">
      <Card title="Mon profil">
        {customer && !editMode && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Prénom</p>
                <p className="font-medium text-slate-800">{customer.firstName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Nom</p>
                <p className="font-medium text-slate-800">{customer.lastName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Date de naissance</p>
                <p className="font-medium text-slate-800">{customer.dateOfBirth ?? '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Email</p>
                <p className="font-medium text-slate-800">{customer.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Téléphone</p>
                <p className="font-medium text-slate-800">{customer.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Adresse</p>
                <p className="font-medium text-slate-800">{customer.address ?? '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Numéro d'identité</p>
                <p className="font-medium text-slate-800 font-mono">{customer.nationalIdNumber}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Opérateur</p>
                <p className="font-medium text-slate-800">{operatorName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Statut KYC</p>
                <KycBadge status={customer.kycStatus} />
              </div>
              {customer.createdAt && (
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">Membre depuis</p>
                  <p className="font-medium text-slate-800">
                    {new Date(customer.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
            {msg && <p className="text-green-600 text-sm">{msg}</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={openEdit}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Modifier mon profil
            </button>
          </div>
        )}

        {customer && editMode && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <p className="text-xs text-slate-400">Email et numéro d'identité ne peuvent pas être modifiés.</p>
            {([
              { key: 'firstName',   label: 'Prénom',           type: 'text' },
              { key: 'lastName',    label: 'Nom',               type: 'text' },
              { key: 'dateOfBirth', label: 'Date de naissance', type: 'date' },
              { key: 'phone',       label: 'Téléphone',         type: 'tel' },
              { key: 'address',     label: 'Adresse',           type: 'text' },
            ] as { key: keyof typeof editForm; label: string; type: string }[]).map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input
                  required
                  type={type}
                  value={editForm[key]}
                  onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            {msg && <p className="text-green-600 text-sm">{msg}</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => { setEditMode(false); setMsg(''); setError('') }}
                className="flex-1 bg-slate-100 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-200 transition"
              >
                Annuler
              </button>
            </div>
          </form>
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
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'CURRENT' ? 'Courant' : t === 'SAVINGS' ? 'Épargne' : 'Portefeuille'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Opérateur</label>
            <select
              value={accountOperatorId}
              onChange={(e) => setAccountOperatorId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Par défaut ({operatorName})</option>
              {operators.map((o) => (
                <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="XAF">XAF (Franc CFA)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dollar)</option>
            </select>
          </div>
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
              <th className="pb-2">Devise</th>
              <th className="pb-2 text-right">Solde</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="py-2 font-mono text-xs">{a.accountNumber}</td>
                <td className="py-2 text-slate-500">
                  {a.accountType === 'CURRENT' ? 'Courant'
                    : a.accountType === 'SAVINGS' ? 'Épargne'
                    : 'Portefeuille'}
                </td>
                <td className="py-2 text-slate-500">{a.currency}</td>
                <td className="py-2 text-right font-semibold text-slate-800">
                  {a.balance.toLocaleString('fr-FR')}
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-slate-400 text-center">Aucun compte ouvert.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
