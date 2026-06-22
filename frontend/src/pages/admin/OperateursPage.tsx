import { useEffect, useState, FormEvent } from 'react'
import api from '../../api/axios'
import { parseError } from '../../api/parseError'
import Card from '../../components/Card'

interface BusinessRule { id: string; ruleType: string; value: string }
interface Operator {
  id: string; name: string; code: string; country: string
  status: string; rules: BusinessRule[]
}

interface EditState {
  name: string; country: string
  commission: string; ceiling: string
}

export default function OperateursPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  // Création opérateur
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [country, setCountry] = useState('')
  const [commissionRate, setCommissionRate] = useState('')
  const [ceiling, setCeiling] = useState('')

  // Compte opérateur
  const [accUsername, setAccUsername] = useState('')
  const [accPassword, setAccPassword] = useState('')
  const [accEmail, setAccEmail] = useState('')
  const [accOperatorId, setAccOperatorId] = useState('')
  const [accMsg, setAccMsg] = useState('')
  const [accError, setAccError] = useState('')

  // Édition inline
  const [editId, setEditId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', country: '', commission: '', ceiling: '' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Statut actions
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({})

  const fetchOperators = () =>
    api.get('/operators')
      .then((r) => setOperators(r.data))
      .catch(() => setError('Impossible de charger la liste des opérateurs.'))
      .finally(() => setLoading(false))

  useEffect(() => { fetchOperators() }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault(); setError(''); setMsg('')
    try {
      await api.post('/operators', {
        name, code, country,
        rules: [
          { ruleType: 'COMMISSION', value: commissionRate },
          { ruleType: 'CEILING',    value: ceiling },
        ],
      })
      setMsg('Opérateur créé.')
      setName(''); setCode(''); setCountry(''); setCommissionRate(''); setCeiling('')
      fetchOperators()
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(typeof message === 'string' ? message : "Impossible de créer l'opérateur.")
    }
  }

  function startEdit(op: Operator) {
    const commission = op.rules.find((r) => r.ruleType === 'COMMISSION')?.value ?? ''
    const ceil       = op.rules.find((r) => r.ruleType === 'CEILING')?.value ?? ''
    setEditId(op.id)
    setEditState({ name: op.name, country: op.country, commission, ceiling: ceil })
    setEditError('')
  }

  async function handleSaveEdit(opId: string) {
    setEditLoading(true); setEditError('')
    try {
      await api.put(`/operators/${opId}`, {
        name:    editState.name,
        country: editState.country,
        rules: [
          { ruleType: 'COMMISSION', value: editState.commission },
          { ruleType: 'CEILING',    value: editState.ceiling    },
        ],
      })
      setEditId(null)
      fetchOperators()
    } catch (err: any) {
      setEditError(parseError(err, "Impossible de modifier l'opérateur."))
    } finally {
      setEditLoading(false)
    }
  }

  async function toggleStatus(op: Operator) {
    const newStatus = op.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    setStatusLoading((p) => ({ ...p, [op.id]: true }))
    try {
      await api.patch(`/operators/${op.id}/status`, { status: newStatus })
      fetchOperators()
    } catch {
      setError(`Impossible de modifier le statut de ${op.name}.`)
    } finally {
      setStatusLoading((p) => ({ ...p, [op.id]: false }))
    }
  }

  async function handleCreateOperatorAccount(e: FormEvent) {
    e.preventDefault(); setAccError(''); setAccMsg('')
    try {
      await api.post('/auth/operators', {
        username: accUsername, password: accPassword,
        email: accEmail, operatorId: accOperatorId,
      })
      setAccMsg('Compte opérateur créé.')
      setAccUsername(''); setAccPassword(''); setAccEmail(''); setAccOperatorId('')
    } catch (err: any) {
      const message = err.response?.data?.message
      setAccError(typeof message === 'string' ? message : "Impossible de créer le compte opérateur.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Création opérateur */}
      <Card title="Créer un opérateur" className="max-w-md">
        <form onSubmit={handleCreate} className="space-y-4">
          {[
            { label: 'Nom',       val: name,           set: setName,           ph: '' },
            { label: 'Code',      val: code,           set: setCode,           ph: 'MTN' },
            { label: 'Pays',      val: country,        set: setCountry,        ph: 'Cameroun' },
            { label: 'Commission',val: commissionRate, set: setCommissionRate, ph: '1.5%' },
            { label: 'Plafond',   val: ceiling,        set: setCeiling,        ph: '500000' },
          ].map(({ label, val, set, ph }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input required value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          {msg   && <p className="text-green-600 text-sm">{msg}</p>}
          {error && <p className="text-red-500  text-sm">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
            Créer
          </button>
        </form>
      </Card>

      {/* Liste des opérateurs */}
      <Card title="Liste des opérateurs">
        {loading ? <p className="text-slate-400 text-sm">Chargement...</p> : (
          <div className="space-y-3">
            {operators.map((op) => (
              <div key={op.id} className="border border-slate-100 rounded-xl p-4 space-y-3">
                {/* En-tête */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{op.name}
                      <span className="ml-2 font-mono text-xs text-slate-400">{op.code}</span>
                    </p>
                    <p className="text-xs text-slate-400">{op.country} · {(op.rules ?? []).map((r) => `${r.ruleType}: ${r.value}`).join(', ')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${op.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {op.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                    </span>
                    <button onClick={() => startEdit(op)}
                      className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-lg hover:bg-slate-200 transition">
                      Modifier
                    </button>
                    <button onClick={() => toggleStatus(op)} disabled={statusLoading[op.id]}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition disabled:opacity-50 ${
                        op.status === 'ACTIVE'
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}>
                      {statusLoading[op.id] ? '...' : op.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
                    </button>
                  </div>
                </div>

                {/* Formulaire d'édition inline */}
                {editId === op.id && (
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-0.5">Nom</label>
                        <input value={editState.name}
                          onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-0.5">Pays</label>
                        <input value={editState.country}
                          onChange={(e) => setEditState((s) => ({ ...s, country: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-0.5">Commission</label>
                        <input value={editState.commission}
                          onChange={(e) => setEditState((s) => ({ ...s, commission: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-0.5">Plafond</label>
                        <input value={editState.ceiling}
                          onChange={(e) => setEditState((s) => ({ ...s, ceiling: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    {editError && <p className="text-red-500 text-xs">{editError}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(op.id)} disabled={editLoading}
                        className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                        {editLoading ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="text-xs bg-slate-100 text-slate-600 px-4 py-1.5 rounded-lg hover:bg-slate-200 transition">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {operators.length === 0 && (
              <p className="py-4 text-slate-400 text-center text-sm">Aucun opérateur.</p>
            )}
          </div>
        )}
      </Card>

      {/* Créer un compte opérateur */}
      <Card title="Créer un compte opérateur" className="max-w-md">
        <p className="text-sm text-slate-500 mb-4">
          Crée un compte de connexion pour un employé d'un opérateur.
        </p>
        <form onSubmit={handleCreateOperatorAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Opérateur</label>
            <select required value={accOperatorId} onChange={(e) => setAccOperatorId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner...</option>
              {operators.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
            </select>
          </div>
          {[
            { label: "Nom d'utilisateur", val: accUsername, set: setAccUsername, type: 'text'    },
            { label: 'Email',             val: accEmail,    set: setAccEmail,    type: 'email'   },
            { label: 'Mot de passe',      val: accPassword, set: setAccPassword, type: 'password'},
          ].map(({ label, val, set, type }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input required type={type} value={val} onChange={(e) => set(e.target.value)}
                minLength={type === 'password' ? 6 : undefined}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          {accMsg   && <p className="text-green-600 text-sm">{accMsg}</p>}
          {accError && <p className="text-red-500  text-sm">{accError}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
            Créer le compte
          </button>
        </form>
      </Card>
    </div>
  )
}
