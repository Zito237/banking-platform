import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'
import { useMyAccounts } from '../../hooks/useMyAccounts'

interface Transaction {
  id: string
  reference: string
  type: string
  amount: number
  currency: string
  fees: number
  sourceAccountId: string
  destinationAccountId: string | null
  status: string
  createdAt: string
}

const TYPE_LABEL: Record<string, { label: string; sign: string; color: string }> = {
  DEPOSIT:        { label: 'Dépôt',              sign: '+', color: 'text-green-600' },
  WITHDRAWAL:     { label: 'Retrait',             sign: '-', color: 'text-red-600'   },
  TRANSFER_INTRA: { label: 'Transfert interne',   sign: '-', color: 'text-blue-600'  },
  TRANSFER_INTER: { label: 'Transfert externe',   sign: '-', color: 'text-blue-600'  },
  REPAYMENT:      { label: 'Remboursement prêt',  sign: '-', color: 'text-purple-600'},
}

const STATUS_STYLE: Record<string, { label: string; classes: string }> = {
  COMPLETED:   { label: 'Réussi',      classes: 'bg-green-100 text-green-700'   },
  PENDING:     { label: 'En attente',  classes: 'bg-yellow-100 text-yellow-700' },
  FAILED:      { label: 'Échoué',      classes: 'bg-red-100 text-red-600'       },
  COMPENSATED: { label: 'Compensé',    classes: 'bg-slate-100 text-slate-600'   },
}

export default function HistoriquePage() {
  const { options } = useMyAccounts()
  const [accountId, setAccountId] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-sélectionne le premier compte dès le chargement
  useEffect(() => {
    if (options.length > 0 && !accountId) {
      setAccountId(options[0].value)
    }
  }, [options])

  useEffect(() => {
    if (!accountId) return
    setLoading(true)
    setError('')
    api.get('/transactions', { params: { accountId } })
      .then((r) => setTransactions(r.data))
      .catch(() => setError('Impossible de charger l\'historique.'))
      .finally(() => setLoading(false))
  }, [accountId])

  return (
    <div className="space-y-4">
      <Card title="Historique des transactions">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Compte</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full max-w-sm border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {options.length === 0 && <option value="">Chargement...</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {loading ? (
          <p className="text-slate-400 text-sm">Chargement...</p>
        ) : transactions.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Aucune transaction pour ce compte.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Type</th>
                  <th className="pb-2 pr-3">Référence</th>
                  <th className="pb-2 pr-3 text-right">Montant</th>
                  <th className="pb-2 pr-3 text-right">Frais</th>
                  <th className="pb-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {transactions
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((t) => {
                    const typeInfo = TYPE_LABEL[t.type] ?? { label: t.type, sign: '', color: 'text-slate-600' }
                    const statusInfo = STATUS_STYLE[t.status] ?? { label: t.status, classes: 'bg-slate-100 text-slate-600' }
                    const isIncoming = t.type === 'DEPOSIT' || (t.destinationAccountId === accountId)
                    const sign = isIncoming ? '+' : '-'
                    const amountColor = isIncoming ? 'text-green-600' : 'text-red-600'
                    return (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="py-2 pr-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-2 pr-3 font-medium text-slate-700">{typeInfo.label}</td>
                        <td className="py-2 pr-3 font-mono text-xs text-slate-400">{t.reference}</td>
                        <td className={`py-2 pr-3 text-right font-semibold ${amountColor}`}>
                          {sign}{Number(t.amount).toLocaleString('fr-FR')} <span className="font-normal text-slate-400">{t.currency}</span>
                        </td>
                        <td className="py-2 pr-3 text-right text-slate-400 text-xs">
                          {t.fees > 0 ? `${Number(t.fees).toLocaleString('fr-FR')} ${t.currency}` : '—'}
                        </td>
                        <td className="py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.classes}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
