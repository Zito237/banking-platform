// Opérateur : rapports (transactions et prêts)
import { useEffect, useState } from 'react'
import axios from 'axios'
import Card from '../../components/Card'

const reporting = axios.create({ baseURL: import.meta.env.VITE_REPORTING_URL })

interface TransactionsReport {
  totalVolume: number
  totalFees: number
  transactionCount: number
  transactionsByType: Record<string, { count: number; volume: number }>
  message?: string
}

interface LoansReport {
  totalApprovedLoans: number
  totalPrincipal: number
  averageInterestRate: number
  averageTermMonths: number
  message?: string
}

export default function RapportsPage() {
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
      .catch(() => setError('Impossible de charger les rapports.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {loading ? <p className="text-slate-400 text-sm">Chargement...</p> : error ? (
        <Card title="Rapports"><p className="text-slate-400 text-sm text-center py-4">{error}</p></Card>
      ) : (
        <>
          <Card title="Transactions">
            {txReport?.message ? (
              <p className="text-slate-400 text-sm text-center py-4">{txReport.message}</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Volume total</p>
                    <p className="text-xl font-bold text-slate-800">{txReport?.totalVolume.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Frais collectés</p>
                    <p className="text-xl font-bold text-slate-800">{txReport?.totalFees.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Nombre d'opérations</p>
                    <p className="text-xl font-bold text-slate-800">{txReport?.transactionCount}</p>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b">
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Nombre</th>
                      <th className="pb-2 text-right">Volume (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(txReport?.transactionsByType ?? {}).map(([type, v]) => (
                      <tr key={type} className="border-b last:border-0">
                        <td className="py-2">{type}</td>
                        <td className="py-2">{v.count}</td>
                        <td className="py-2 text-right">{v.volume.toLocaleString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </Card>

          <Card title="Prêts">
            {loanReport?.message ? (
              <p className="text-slate-400 text-sm text-center py-4">{loanReport.message}</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Prêts approuvés</p>
                  <p className="text-xl font-bold text-slate-800">{loanReport?.totalApprovedLoans}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Capital total</p>
                  <p className="text-xl font-bold text-slate-800">{loanReport?.totalPrincipal.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Taux moyen</p>
                  <p className="text-xl font-bold text-slate-800">{((loanReport?.averageInterestRate ?? 0) * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Durée moyenne</p>
                  <p className="text-xl font-bold text-slate-800">{loanReport?.averageTermMonths} mois</p>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
