// Admin : rapports globaux (toutes opérations, tous opérateurs)
import { useEffect, useState } from 'react'
import axios from 'axios'
import Card from '../../components/Card'

const reporting = axios.create({ baseURL: import.meta.env.VITE_REPORTING_URL })

interface TransactionsReport {
  totalVolume: number
  totalFees: number
  transactionCount: number
  message?: string
}

interface LoansReport {
  totalApprovedLoans: number
  totalPrincipal: number
  message?: string
}

export default function RapportsAdminPage() {
  const [txReport, setTxReport] = useState<TransactionsReport | null>(null)
  const [loanReport, setLoanReport] = useState<LoansReport | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      reporting.get('/reports/transactions'),
      reporting.get('/reports/loans'),
    ])
      .then(([tx, loans]) => {
        setTxReport(tx.data)
        setLoanReport(loans.data)
      })
      .catch(() => setError('Données non disponibles.'))
      .finally(() => setLoading(false))
  }, [])

  const items = (txReport && !txReport.message && loanReport && !loanReport.message) ? [
    { label: 'Volume total (FCFA)', value: txReport.totalVolume.toLocaleString('fr-FR') },
    { label: 'Frais collectés (FCFA)', value: txReport.totalFees.toLocaleString('fr-FR') },
    { label: 'Transactions', value: txReport.transactionCount },
    { label: 'Prêts approuvés', value: loanReport.totalApprovedLoans },
    { label: 'Capital prêté (FCFA)', value: loanReport.totalPrincipal.toLocaleString('fr-FR') },
  ] : []

  return (
    <div className="space-y-6">
      {loading ? <p className="text-slate-400 text-sm">Chargement...</p> : items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {items.map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <Card title="Rapports globaux">
          <p className="text-slate-400 text-sm text-center py-4">{error || 'Données non disponibles.'}</p>
        </Card>
      )}
    </div>
  )
}
