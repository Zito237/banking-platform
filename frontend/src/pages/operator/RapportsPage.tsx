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

export default function RapportsPage() {
  const [operatorId, setOperatorId] = useState<string | null>(null)
  const [txReport, setTxReport] = useState<TransactionsReport | null>(null)
  const [loanReport, setLoanReport] = useState<LoansReport | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')

  // Période
  const now = new Date()
  const [fromDate, setFromDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  )
  const [toDate, setToDate] = useState(now.toISOString().slice(0, 10))

  async function fetchReports(opId: string | null, from: string, to: string) {
    setLoadingData(true)
    setError('')
    try {
      const params: Record<string, string> = { from, to }
      if (opId) params.operatorId = opId

      const [tx, loans] = await Promise.all([
        reporting.get('/reports/transactions', { params }),
        reporting.get('/reports/loans', { params: opId ? { operatorId: opId } : {} }),
      ])
      setTxReport(tx.data)
      setLoanReport(loans.data)
    } catch {
      setError('Service de reporting indisponible.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        const opId = data.linkedOperatorId ?? data.operatorId ?? null
        setOperatorId(opId)
        fetchReports(opId, fromDate, toDate)
      })
      .catch(() => fetchReports(null, fromDate, toDate))
  }, [])

  function handleFilter() {
    fetchReports(operatorId, fromDate, toDate)
  }

  const typeChartData = Object.entries(txReport?.transactionsByType ?? {}).map(([type, v]) => ({
    label: type.replace('_', ' '),
    value: v.count,
    color: TYPE_COLORS[type] ?? '#94a3b8',
  }))

  const volumeChartData = Object.entries(txReport?.transactionsByType ?? {}).map(([type, v]) => ({
    label: type.replace('_', ' '),
    value: Math.round(v.volume),
    color: TYPE_COLORS[type] ?? '#94a3b8',
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Rapports</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Statistiques de votre opérateur{operatorId ? ` (ID: ${operatorId.slice(0, 8)}…)` : ''}
        </p>
      </div>

      {/* Filtre période */}
      <Card title="Période d'analyse">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Du</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Au</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Filtrer
          </button>
        </div>
      </Card>

      {loadingData ? (
        <p className="text-slate-400 text-sm">Chargement des rapports…</p>
      ) : error ? (
        <Card title="Rapports"><p className="text-slate-400 text-sm text-center py-6">{error}</p></Card>
      ) : (
        <>
          {/* KPI Transactions */}
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

          {/* Graphiques */}
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
              <p className="text-slate-400 text-sm text-center py-4">
                {txReport?.message ?? 'Aucune transaction sur cette période.'}
              </p>
            </Card>
          )}

          {/* KPI Prêts */}
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
              <p className="text-slate-400 text-sm text-center py-4">
                {loanReport?.message ?? 'Aucun prêt approuvé.'}
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
