import { useEffect, useState, useCallback } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'
import { useMyAccounts } from '../../hooks/useMyAccounts'
import { parseError } from '../../api/parseError'

interface LoanApplication {
  id: string
  requestedAmount: number
  purpose: string
  status: string
}

interface Installment {
  id: string
  dueDate: string
  amount: number
  principalPart: number
  interestPart: number
  status: string
  paidAt?: string
}

interface LoanDetail {
  id: string           // loan entity UUID (needed for repay)
  applicationId: string
  principal: number
  interestRate: number
  termMonths: number
  status: string
  installments: Installment[]
}

const INST_STATUS: Record<string, { label: string; classes: string }> = {
  PENDING: { label: 'À payer',   classes: 'bg-yellow-100 text-yellow-700' },
  PAID:    { label: 'Payée',     classes: 'bg-green-100  text-green-700'  },
  OVERDUE: { label: 'En retard', classes: 'bg-red-100    text-red-600'    },
}

export default function RemboursementPage() {
  const { options: accountOptions, refresh: refreshAccounts } = useMyAccounts()
  const [selectedAccount, setSelectedAccount] = useState('')
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [loans, setLoans] = useState<LoanDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Per-loan UI state
  const [paying, setPaying]       = useState<Record<string, boolean>>({})
  const [success, setSuccess]     = useState<Record<string, string>>({})
  const [payError, setPayError]   = useState<Record<string, string>>({})
  const [showAll, setShowAll]     = useState<Record<string, boolean>>({})

  const fetchLoans = useCallback(async (custId: string) => {
    setLoading(true); setError('')
    try {
      const { data: apps } = await api.get<LoanApplication[]>('/loans', {
        params: { customerId: custId },
      })
      const approved = apps.filter((a) => a.status === 'APPROVED')

      const details = await Promise.all(
        approved.map(async (app) => {
          const { data } = await api.get(`/loans/by-application/${app.id}`)
          return {
            id:            data.id,
            applicationId: app.id,
            principal:     data.principal,
            interestRate:  data.interestRate,
            termMonths:    data.termMonths,
            status:        data.status,
            installments:  data.schedule?.installments ?? [],
          } as LoanDetail
        })
      )
      setLoans(details)
    } catch {
      setError('Impossible de charger vos prêts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        if (!data.linkedCustomerId) {
          setError("Aucun profil client n'est encore associé à votre compte.")
          return
        }
        setCustomerId(data.linkedCustomerId)
        fetchLoans(data.linkedCustomerId)
      })
      .catch(() => setError('Impossible de charger votre profil.'))
  }, [fetchLoans])

  // Auto-select first account when list loads
  useEffect(() => {
    if (accountOptions.length > 0 && !selectedAccount) {
      setSelectedAccount(accountOptions[0].value)
    }
  }, [accountOptions, selectedAccount])

  async function payInstallment(loanId: string, applicationId: string, installmentId: string) {
    if (!selectedAccount) {
      setPayError((p) => ({ ...p, [loanId]: 'Sélectionnez un compte à débiter.' }))
      return
    }
    setPaying((p) => ({ ...p, [loanId]: true }))
    setPayError((p) => ({ ...p, [loanId]: '' }))
    setSuccess((p) => ({ ...p, [loanId]: '' }))
    try {
      const { data } = await api.post(`/loans/${loanId}/repay`, {
        installmentId,
        accountId: selectedAccount,
      })
      setSuccess((p) => ({
        ...p,
        [loanId]: `Mensualité du ${new Date(data.dueDate).toLocaleDateString('fr-FR')} payée avec succès.`,
      }))
      refreshAccounts()
      if (customerId) fetchLoans(customerId)
    } catch (err: any) {
      setPayError((p) => ({
        ...p,
        [loanId]: parseError(err, 'Le remboursement a échoué.'),
      }))
    } finally {
      setPaying((p) => ({ ...p, [loanId]: false }))
    }
  }

  const activeLoans   = loans.filter((l) => l.status !== 'PAID_OFF')
  const completedLoans = loans.filter((l) => l.status === 'PAID_OFF')

  return (
    <div className="space-y-6">
      {/* Sélecteur de compte */}
      <Card title="Compte à débiter">
        <div className="max-w-sm">
          {accountOptions.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun compte actif trouvé.</p>
          ) : (
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {accountOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
        </div>
      </Card>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading ? (
        <p className="text-slate-400 text-sm">Chargement...</p>
      ) : (
        <>
          {/* Prêts actifs */}
          <Card title={`Prêts en cours (${activeLoans.length})`}>
            {activeLoans.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">
                Aucun prêt en cours à rembourser.
              </p>
            ) : (
              <div className="space-y-5">
                {activeLoans.map((loan) => {
                  const pending   = loan.installments.filter((i) => i.status === 'PENDING')
                  const paid      = loan.installments.filter((i) => i.status === 'PAID').length
                  const overdue   = loan.installments.filter((i) => i.status === 'OVERDUE')
                  const nextDue   = overdue.length > 0 ? overdue[0] : pending[0]
                  const expanded  = showAll[loan.id]
                  const displayed = expanded ? loan.installments : loan.installments.slice(0, 4)
                  const progress  = Math.round((paid / loan.termMonths) * 100)

                  return (
                    <div key={loan.id} className="border border-slate-100 rounded-xl p-4 space-y-3">
                      {/* En-tête du prêt */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {Number(loan.principal).toLocaleString('fr-FR')} FCFA
                          </p>
                          <p className="text-xs text-slate-400">
                            {loan.termMonths} mois · {(loan.interestRate * 100).toFixed(1)}% / an
                          </p>
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                          {paid}/{loan.termMonths} payées
                        </span>
                      </div>

                      {/* Barre de progression */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Prochaine mensualité due */}
                      {nextDue && (
                        <div className={`rounded-lg p-3 ${overdue.length > 0 ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'}`}>
                          <p className={`text-xs font-semibold mb-2 ${overdue.length > 0 ? 'text-red-700' : 'text-blue-700'}`}>
                            {overdue.length > 0 ? 'Mensualité en retard' : 'Prochaine mensualité'}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold text-slate-800">
                                {Number(nextDue.amount).toLocaleString('fr-FR')} FCFA
                              </p>
                              <p className="text-xs text-slate-500">
                                Échéance : {new Date(nextDue.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                              <p className="text-xs text-slate-400">
                                Capital {Number(nextDue.principalPart).toLocaleString('fr-FR')} · Intérêts {Number(nextDue.interestPart).toLocaleString('fr-FR')}
                              </p>
                            </div>
                            <button
                              onClick={() => payInstallment(loan.id, loan.applicationId, nextDue.id)}
                              disabled={paying[loan.id] || !selectedAccount}
                              className={`ml-3 px-4 py-2 rounded-lg text-sm font-medium text-white transition disabled:opacity-50 ${
                                overdue.length > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              {paying[loan.id] ? 'Traitement…' : 'Payer'}
                            </button>
                          </div>
                        </div>
                      )}

                      {pending.length === 0 && overdue.length === 0 && (
                        <p className="text-xs text-green-600 font-medium bg-green-50 rounded-lg px-3 py-2">
                          Toutes les mensualités ont été payées.
                        </p>
                      )}

                      {success[loan.id] && (
                        <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
                          {success[loan.id]}
                        </p>
                      )}
                      {payError[loan.id] && (
                        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                          {payError[loan.id]}
                        </p>
                      )}

                      {/* Tableau des échéances */}
                      <div>
                        <table className="w-full text-xs mt-1">
                          <thead>
                            <tr className="text-left text-slate-400 border-b">
                              <th className="pb-1 pr-2">N°</th>
                              <th className="pb-1 pr-2">Échéance</th>
                              <th className="pb-1 pr-2 text-right">Montant</th>
                              <th className="pb-1">Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayed.map((inst, idx) => {
                              const s = INST_STATUS[inst.status] ?? { label: inst.status, classes: 'bg-slate-100 text-slate-600' }
                              return (
                                <tr key={inst.id} className={`border-b last:border-0 ${inst.status === 'PAID' ? 'opacity-50' : ''}`}>
                                  <td className="py-1 pr-2 text-slate-400">{idx + 1}</td>
                                  <td className="py-1 pr-2 text-slate-600 whitespace-nowrap">
                                    {new Date(inst.dueDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="py-1 pr-2 text-right font-medium text-slate-700">
                                    {Number(inst.amount).toLocaleString('fr-FR')}
                                  </td>
                                  <td className="py-1">
                                    <span className={`inline-block px-1.5 py-0.5 rounded-full font-medium ${s.classes}`}>
                                      {s.label}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                        {loan.installments.length > 4 && (
                          <button
                            onClick={() => setShowAll((p) => ({ ...p, [loan.id]: !expanded }))}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium"
                          >
                            {expanded
                              ? '▲ Réduire'
                              : `▼ Voir toutes (${loan.installments.length} échéances)`}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Prêts terminés */}
          {completedLoans.length > 0 && (
            <Card title={`Prêts remboursés (${completedLoans.length})`}>
              <div className="space-y-2">
                {completedLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {Number(loan.principal).toLocaleString('fr-FR')} FCFA
                      </p>
                      <p className="text-xs text-slate-400">{loan.termMonths} mois · entièrement remboursé</p>
                    </div>
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      Soldé
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
