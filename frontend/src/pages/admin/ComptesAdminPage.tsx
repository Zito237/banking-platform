import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'
import { parseError } from '../../api/parseError'

interface Account {
  id: string
  accountNumber: string
  accountType: string
  balance: number
  currency: string
  ceiling: number | null
  status: string
  openedAt: string
  customerId: string
  operatorId: string
}

const TYPE_LABEL: Record<string, string> = {
  CURRENT: 'Courant',
  SAVINGS: 'Épargne',
  WALLET:  'Portefeuille',
}

const STATUS_STYLE: Record<string, { label: string; classes: string }> = {
  ACTIVE:  { label: 'Actif',   classes: 'bg-green-100 text-green-700' },
  BLOCKED: { label: 'Bloqué',  classes: 'bg-orange-100 text-orange-700' },
  CLOSED:  { label: 'Fermé',   classes: 'bg-red-100 text-red-600' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { label: status, classes: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${s.classes}`}>
      {s.label}
    </span>
  )
}

export default function ComptesAdminPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED' | 'CLOSED'>('ALL')

  function load() {
    setLoading(true)
    api.get('/accounts/all')
      .then((r) => setAccounts(r.data))
      .catch(() => setError('Impossible de charger les comptes.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function changeStatus(id: string, status: string) {
    setMsg(''); setError('')
    try {
      const { data } = await api.patch(`/accounts/${id}/status`, { status })
      setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, status: data.status } : a))
      setMsg(`Compte mis à jour : ${status}`)
    } catch (err: any) {
      setError(parseError(err, 'Impossible de modifier le statut.'))
    }
  }

  const displayed = accounts.filter((a) => filter === 'ALL' || a.status === filter)

  return (
    <div className="space-y-4">
      <Card title="Gestion des comptes">
        <div className="flex gap-2 mb-4">
          {(['ALL', 'ACTIVE', 'BLOCKED', 'CLOSED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'ALL' ? 'Tous' : STATUS_STYLE[f]?.label ?? f}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 self-center">{displayed.length} compte(s)</span>
        </div>

        {msg && <p className="text-green-600 text-sm mb-3">{msg}</p>}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {loading ? (
          <p className="text-slate-400 text-sm">Chargement...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b text-xs">
                  <th className="pb-2 pr-3">Numéro</th>
                  <th className="pb-2 pr-3">Type</th>
                  <th className="pb-2 pr-3">Client ID</th>
                  <th className="pb-2 pr-3 text-right">Solde</th>
                  <th className="pb-2 pr-3 text-right">Plafond</th>
                  <th className="pb-2 pr-3">Statut</th>
                  <th className="pb-2 pr-3">Ouvert le</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 pr-3 font-mono text-xs">{a.accountNumber}</td>
                    <td className="py-2 pr-3 text-slate-600">{TYPE_LABEL[a.accountType] ?? a.accountType}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-400 max-w-[120px] truncate" title={a.customerId}>
                      {a.customerId.slice(0, 8)}…
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold">
                      {a.balance.toLocaleString('fr-FR')} <span className="text-slate-400 font-normal">{a.currency}</span>
                    </td>
                    <td className="py-2 pr-3 text-right text-slate-500">
                      {a.ceiling != null ? `${a.ceiling.toLocaleString('fr-FR')} ${a.currency}` : '—'}
                    </td>
                    <td className="py-2 pr-3"><StatusBadge status={a.status} /></td>
                    <td className="py-2 pr-3 text-slate-500 text-xs">
                      {a.openedAt ? new Date(a.openedAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1 flex-wrap">
                        {a.status !== 'ACTIVE' && (
                          <button
                            onClick={() => changeStatus(a.id, 'ACTIVE')}
                            className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                          >
                            Activer
                          </button>
                        )}
                        {a.status !== 'BLOCKED' && a.status !== 'CLOSED' && (
                          <button
                            onClick={() => changeStatus(a.id, 'BLOCKED')}
                            className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition"
                          >
                            Bloquer
                          </button>
                        )}
                        {a.status !== 'CLOSED' && (
                          <button
                            onClick={() => changeStatus(a.id, 'CLOSED')}
                            className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                          >
                            Fermer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {displayed.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-slate-400">Aucun compte.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
