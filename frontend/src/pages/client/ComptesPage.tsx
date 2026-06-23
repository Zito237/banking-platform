import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'

interface Operator { id: string; name: string; code: string }

interface Account {
  id: string
  accountNumber: string
  accountType: string
  balance: number
  currency: string
  ceiling: number | null
  status: string
  openedAt: string
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

export default function ComptesPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        if (!data.linkedCustomerId) {
          setError("Aucun profil client n'est encore associé à votre compte.")
          return
        }
        return Promise.all([
          api.get('/accounts', { params: { customerId: data.linkedCustomerId } }),
          api.get('/operators'),
        ]).then(([a, o]) => { setAccounts(a.data); setOperators(o.data) })
      })
      .catch(() => setError('Impossible de charger vos comptes.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-slate-400 text-sm">Chargement...</p>
  if (error) return <p className="text-red-500 text-sm">{error}</p>

  return (
    <div className="space-y-4">
      <Card title="Mes comptes">
        {accounts.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Aucun compte ouvert.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border p-4 ${a.status === 'ACTIVE' ? 'border-slate-200' : a.status === 'BLOCKED' ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-slate-400">
                      {a.accountNumber}
                      <span className="ml-2 font-sans text-slate-500">
                        — {operators.find((o) => o.id === a.operatorId)?.name ?? ''}
                      </span>
                    </p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {TYPE_LABEL[a.accountType] ?? a.accountType}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Solde</p>
                    <p className="font-bold text-xl text-slate-800">
                      {a.balance.toLocaleString('fr-FR')} <span className="text-sm font-normal text-slate-500">{a.currency}</span>
                    </p>
                  </div>
                  {a.ceiling != null && (
                    <div>
                      <p className="text-slate-400 text-xs">Plafond</p>
                      <p className="font-medium text-slate-700">
                        {a.ceiling.toLocaleString('fr-FR')} {a.currency}
                      </p>
                    </div>
                  )}
                  {a.openedAt && (
                    <div>
                      <p className="text-slate-400 text-xs">Ouvert le</p>
                      <p className="text-slate-600">{new Date(a.openedAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
