import { useEffect, useState } from 'react'
import axios from 'axios'
import api from '../../api/axios'
import Card from '../../components/Card'
import BarChart from '../../components/BarChart'

const reporting = axios.create({ baseURL: import.meta.env.VITE_REPORTING_URL })

interface TxByType { count: number; volume: number }
interface TransactionsReport {
  totalVolume: number
  totalFees: number
  transactionCount: number
  transactionsByType: Record<string, TxByType>
  message?: string
}
interface LoansReport {
  totalApprovedLoans: number
  totalPrincipal: number
  averageInterestRate: number
  averageTermMonths: number
  message?: string
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
  const [txReport, setTxReport] = useState<TransactionsReport | null>(null)
  const [loanReport, setLoanReport] = useState<LoansReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [error, setError] = useState('')

  const now = new Date()
  const [fromDate, setFromDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  )
  const [toDate, setToDate] = useState(now.toISOString().slice(0, 10))

  async function doSync() {
    const [txResult, loanResult] = await Promise.allSettled([
      api.get('/transactions/all'),
      api.get('/loans'),
    ])
    const txData = txResult.status === 'fulfilled' ? txResult.value.data ?? [] : []
    const loanData = loanResult.status === 'fulfilled' ? loanResult.value.data ?? [] : []
    await reporting.post('/admin/backfill', { transactions: txData, loans: loanData })
  }

  async function fetchReports() {
    setLoading(true)
    setError('')
    try {
      try { await doSync() } catch { /* non-critical */ }

      const [tx, loans] = await Promise.all([
        reporting.get('/reports/transactions', {
          params: { from: fromDate, to: toDate + 'T23:59:59' },
        }),
        reporting.get('/reports/loans'),
      ])
      setTxReport(tx.data)
      setLoanReport(loans.data)
    } catch {
      setError('Service de reporting indisponible.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      await fetchReports()
      setSyncMsg('Données synchronisées avec succès.')
    } catch {
      setSyncMsg('Erreur lors de la synchronisation.')
    } finally {
      setSyncing(false)
    }
  }

  const typeChartData = Object.entries(txReport?.transactionsByType ?? {}).map(([type, v]) => ({
    label: TYPE_LABELS[type] ?? type,
    value: v.count,
    color: TYPE_COLORS[type] ?? '#94a3b8',
  }))

  const volumeChartData = Object.entries(txReport?.transactionsByType ?? {}).map(([type, v]) => ({
    label: TYPE_LABELS[type] ?? type,
    value: Math.round(v.volume),
    color: TYPE_COLORS[type] ?? '#94a3b8',
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rapports</h1>
          <p className="text-sm text-slate-400 mt-0.5">Statistiques des opérations</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {syncing
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <span>⟳</span>}
          {syncing ? 'Synchronisation…' : 'Synchroniser les données'}
        </button>
      </div>

      {syncMsg && (
        <div className={`text-sm px-4 py-2 rounded-lg ${syncMsg.startsWith('Erreur') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {syncMsg}
        </div>
      )}

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
          <button onClick={fetchReports}
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
              { label: 'Volume total', value: `${(txReport?.totalVolume ?? 0).toLocaleString('fr-FR')} FCFA`, color: 'text-blue-600' },
              { label: 'Frais collectés', value: `${(txReport?.totalFees ?? 0).toLocaleString('fr-FR')} FCFA`, color: 'text-emerald-600' },
              { label: 'Nb de transactions', value: txReport?.transactionCount ?? 0, color: 'text-violet-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {typeChartData.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Card title="Transactions par type (nombre)">
                <BarChart data={typeChartData} height={130} />
              </Card>
              <Card title="Volume par type (FCFA)">
                <BarChart data={volumeChartData} unit="FCFA" height={130} />
              </Card>
            </div>
          )}

          {txReport?.message && !typeChartData.length && (
            <Card title="Transactions">
              <p className="text-slate-400 text-sm text-center py-4">{txReport.message}</p>
            </Card>
          )}

          {loanReport && !loanReport.message ? (
            <Card title="Prêts approuvés">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Prêts approuvés', value: loanReport.totalApprovedLoans },
                  { label: 'Capital total (FCFA)', value: loanReport.totalPrincipal.toLocaleString('fr-FR') },
                  { label: 'Taux moyen', value: `${((loanReport.averageInterestRate ?? 0) * 100).toFixed(1)}%` },
                  { label: 'Durée moyenne', value: `${loanReport.averageTermMonths} mois` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="text-xl font-bold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card title="Prêts">
              <p className="text-slate-400 text-sm text-center py-4">{loanReport?.message ?? 'Aucun prêt approuvé.'}</p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
