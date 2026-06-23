import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'
import BarChart from '../../components/BarChart'

interface Transaction {
  id: string
  type: string
  amount: number
  fees: number
  status: string
  createdAt: string
  sourceAccountId?: string
  destinationAccountId?: string
}

interface LoanApp {
  id: string
  customerId: string
  operatorId?: string
  requestedAmount: number
  status: string
  submittedAt: string
}

const TYPE_COLORS: Record<string, string> = {
  DEPOSIT: '#22c55e',
  WITHDRAWAL: '#f97316',
  TRANSFER_INTRA: '#3b82f6',
  TRANSFER_INTER: '#8b5cf6',
  REPAYMENT: '#14b8a6',
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait',
  TRANSFER_INTRA: 'Transfert intra',
  TRANSFER_INTER: 'Transfert inter',
  REPAYMENT: 'Remboursement',
}

export default function RapportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loans, setLoans] = useState<LoanApp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const now = new Date()
  const [fromDate, setFromDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  )
  const [toDate, setToDate] = useState(now.toISOString().slice(0, 10))

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const [txRes, loanRes] = await Promise.all([
        api.get('/transactions/all'),
        api.get('/loans'),
      ])
      setTransactions(txRes.data ?? [])
      setLoans(loanRes.data ?? [])
    } catch {
      setError('Impossible de charger les rapports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredTx = transactions.filter((t) => {
    if (!t.createdAt) return true
    const d = t.createdAt.slice(0, 10)
    return d >= fromDate && d <= toDate
  })

  const completedTx = filteredTx.filter((t) => t.status === 'COMPLETED')

  const totalVolume = completedTx.reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const totalFees = completedTx.reduce((s, t) => s + (Number(t.fees) || 0), 0)

  const byType: Record<string, { count: number; volume: number }> = {}
  completedTx.forEach((t) => {
    if (!byType[t.type]) byType[t.type] = { count: 0, volume: 0 }
    byType[t.type].count++
    byType[t.type].volume += Number(t.amount) || 0
  })

  const approvedLoans = loans.filter((l) => l.status === 'APPROVED')

  const typeChartData = Object.entries(byType).map(([type, v]) => ({
    label: TYPE_LABELS[type] ?? type,
    value: v.count,
    color: TYPE_COLORS[type] ?? '#94a3b8',
  }))

  const volumeChartData = Object.entries(byType).map(([type, v]) => ({
    label: TYPE_LABELS[type] ?? type,
    value: Math.round(v.volume),
    color: TYPE_COLORS[type] ?? '#94a3b8',
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Rapports</h1>
        <p className="text-sm text-slate-400 mt-0.5">Statistiques des opérations</p>
      </div>

      <Card title="Période d'analyse">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Du</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Au</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <button onClick={fetchData}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
            Actualiser
          </button>
        </div>
      </Card>

      {loading ? (
        <p className="text-slate-400 text-sm">Chargement des rapports…</p>
      ) : error ? (
        <Card title="Rapports"><p className="text-slate-400 text-sm text-center py-6">{error}</p></Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Volume total', value: `${totalVolume.toLocaleString('fr-FR')} FCFA`, color: 'text-blue-600' },
              { label: 'Frais collectés', value: `${totalFees.toLocaleString('fr-FR')} FCFA`, color: 'text-emerald-600' },
              { label: 'Nb de transactions', value: completedTx.length, color: 'text-violet-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {typeChartData.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <Card title="Transactions par type (nombre)">
                <BarChart data={typeChartData} height={130} />
              </Card>
              <Card title="Volume par type (FCFA)">
                <BarChart data={volumeChartData} unit="FCFA" height={130} />
              </Card>
            </div>
          ) : (
            <Card title="Transactions">
              <p className="text-slate-400 text-sm text-center py-4">Aucune transaction sur cette période.</p>
            </Card>
          )}

          {approvedLoans.length > 0 ? (
            <Card title="Prêts approuvés">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Prêts approuvés</p>
                  <p className="text-xl font-bold text-slate-800">{approvedLoans.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Montant total demandé (FCFA)</p>
                  <p className="text-xl font-bold text-slate-800">
                    {approvedLoans.reduce((s, l) => s + (Number(l.requestedAmount) || 0), 0).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card title="Prêts">
              <p className="text-slate-400 text-sm text-center py-4">Aucun prêt approuvé.</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
