import { useEffect, useState, useCallback } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'
import LoanScheduleTable from '../../components/LoanScheduleTable'
import { parseError } from '../../api/parseError'

interface LoanApplication {
  id: string
  customerId: string
  requestedAmount: number
  purpose: string
  status: string
  submittedAt: string
  decisionReason?: string
}

interface LoanSchedule {
  principal: number
  interestRate: number
  termMonths: number
  installments: {
    id: string
    dueDate: string
    amount: number
    principalPart: number
    interestPart: number
    status: string
    paidAt?: string
  }[]
}

type Tab = 'SUBMITTED' | 'DECIDED' | 'ALL'

const STATUS_STYLE: Record<string, { label: string; classes: string }> = {
  SUBMITTED:    { label: 'En attente',  classes: 'bg-yellow-100 text-yellow-700' },
  UNDER_REVIEW: { label: 'En examen',   classes: 'bg-blue-100 text-blue-700'    },
  APPROVED:     { label: 'Approuvé',    classes: 'bg-green-100 text-green-700'  },
  REJECTED:     { label: 'Rejeté',      classes: 'bg-red-100 text-red-700'      },
}

export default function DemandesPretPage() {
  const [tab, setTab] = useState<Tab>('SUBMITTED')
  const [loans, setLoans] = useState<LoanApplication[]>([])
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Champs de décision par prêt
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [rates,   setRates]   = useState<Record<string, string>>({})
  const [terms,   setTerms]   = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Confirmation avant action irréversible
  const [confirm, setConfirm] = useState<{ loanId: string; approved: boolean } | null>(null)

  // Échéanciers : applicationId → LoanSchedule | 'loading' | 'error'
  const [schedules, setSchedules] = useState<Record<string, LoanSchedule | 'loading' | 'error'>>({})
  const [openSchedule, setOpenSchedule] = useState<Record<string, boolean>>({})

  async function toggleSchedule(loanId: string) {
    const nowOpen = !openSchedule[loanId]
    setOpenSchedule((prev) => ({ ...prev, [loanId]: nowOpen }))
    if (nowOpen && !schedules[loanId]) {
      setSchedules((prev) => ({ ...prev, [loanId]: 'loading' }))
      try {
        const { data } = await api.get(`/loans/by-application/${loanId}`)
        const loanInfo: LoanSchedule = {
          principal:    data.principal,
          interestRate: data.interestRate,
          termMonths:   data.termMonths,
          installments: data.schedule?.installments ?? [],
        }
        setSchedules((prev) => ({ ...prev, [loanId]: loanInfo }))
      } catch {
        setSchedules((prev) => ({ ...prev, [loanId]: 'error' }))
      }
    }
  }

  // Résolution des noms de clients
  async function resolveCustomerNames(list: LoanApplication[]) {
    const ids = [...new Set(list.map((l) => l.customerId))]
    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          const { data } = await api.get(`/customers/${id}`)
          return [id, `${data.firstName} ${data.lastName}`] as [string, string]
        } catch {
          return [id, id.slice(0, 8) + '…'] as [string, string]
        }
      })
    )
    setCustomerNames(Object.fromEntries(entries))
  }

  const fetchLoans = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params: Record<string, string> = {}
      if (tab === 'SUBMITTED') params.status = 'SUBMITTED'
      // DECIDED fetches without status — we'll filter client-side
      const { data } = await api.get('/loans', { params })
      const list: LoanApplication[] = tab === 'DECIDED'
        ? data.filter((l: LoanApplication) => l.status === 'APPROVED' || l.status === 'REJECTED')
        : data
      setLoans(list)
      await resolveCustomerNames(list)
    } catch {
      setError('Impossible de charger les demandes de prêt.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { fetchLoans() }, [fetchLoans])

  // Étape 1 : validation des champs + demande de confirmation
  function requestDecision(loanId: string, approved: boolean) {
    const reason = reasons[loanId]?.trim()
    if (!reason) {
      setFieldErrors((prev) => ({ ...prev, [loanId]: 'Un motif est obligatoire.' }))
      return
    }
    setFieldErrors((prev) => ({ ...prev, [loanId]: '' }))
    setConfirm({ loanId, approved })
  }

  // Étape 2 : exécution après confirmation
  async function executeDecision() {
    if (!confirm) return
    const { loanId, approved } = confirm
    setConfirm(null)
    try {
      await api.post(`/loans/${loanId}/decision`, {
        approved,
        reason:       reasons[loanId],
        interestRate: rates[loanId]  ? Number(rates[loanId])  : undefined,
        termMonths:   terms[loanId]  ? Number(terms[loanId])  : undefined,
      })
      setReasons((p) => { const n = { ...p }; delete n[loanId]; return n })
      setRates((p)   => { const n = { ...p }; delete n[loanId]; return n })
      setTerms((p)   => { const n = { ...p }; delete n[loanId]; return n })
      fetchLoans()
    } catch (err: any) {
      setFieldErrors((prev) => ({
        ...prev,
        [loanId]: parseError(err, "Impossible d'enregistrer la décision."),
      }))
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'SUBMITTED', label: 'En attente' },
    { key: 'DECIDED',   label: 'Traitées'   },
    { key: 'ALL',       label: 'Toutes'     },
  ]

  return (
    <div className="space-y-4">
      {/* Modal de confirmation */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 space-y-4">
            <p className="font-semibold text-slate-800">Confirmer la décision</p>
            <p className="text-sm text-slate-500">
              Vous êtes sur le point de{' '}
              <span className={`font-semibold ${confirm.approved ? 'text-green-600' : 'text-red-600'}`}>
                {confirm.approved ? 'approuver' : 'rejeter'}
              </span>{' '}
              cette demande. Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <button
                onClick={executeDecision}
                className={`flex-1 py-2 rounded-lg text-sm font-medium text-white transition ${
                  confirm.approved ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Oui, confirmer
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <Card title="Demandes de prêt">
        {/* Onglets */}
        <div className="flex gap-1 mb-4 border-b border-slate-100 pb-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {loading ? (
          <p className="text-slate-400 text-sm">Chargement...</p>
        ) : (
          <div className="space-y-4">
            {loans.map((l) => {
              const name = customerNames[l.customerId] ?? l.customerId.slice(0, 8) + '…'
              const isPending = l.status === 'SUBMITTED' || l.status === 'UNDER_REVIEW'
              const statusInfo = STATUS_STYLE[l.status] ?? { label: l.status, classes: 'bg-slate-100 text-slate-600' }

              return (
                <div key={l.id} className="border border-slate-100 rounded-xl p-4 space-y-3 hover:border-slate-200 transition">
                  {/* En-tête */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {Number(l.requestedAmount).toLocaleString('fr-FR')} FCFA
                        <span className="font-normal text-slate-500"> — {l.purpose}</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">{name}</p>
                      <p className="text-xs text-slate-400">
                        Soumis le {new Date(l.submittedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statusInfo.classes}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Motif de décision (prêts traités) */}
                  {!isPending && l.decisionReason && (
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                      <span className="font-medium">Motif :</span> {l.decisionReason}
                    </p>
                  )}

                  {/* Échéancier (prêts approuvés) */}
                  {!isPending && l.status === 'APPROVED' && (
                    <div>
                      <button
                        onClick={() => toggleSchedule(l.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                      >
                        {openSchedule[l.id] ? "▲ Masquer l'échéancier" : "▼ Voir l'échéancier"}
                      </button>
                      {openSchedule[l.id] && (
                        schedules[l.id] === 'loading' ? (
                          <p className="text-xs text-slate-400 mt-2">Chargement...</p>
                        ) : schedules[l.id] === 'error' ? (
                          <p className="text-xs text-red-500 mt-2">Impossible de charger l'échéancier.</p>
                        ) : schedules[l.id] ? (
                          <LoanScheduleTable loan={schedules[l.id] as LoanSchedule} />
                        ) : null
                      )}
                    </div>
                  )}

                  {/* Formulaire de décision (prêts en attente) */}
                  {isPending && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          placeholder="Motif (obligatoire)"
                          value={reasons[l.id] ?? ''}
                          onChange={(e) => setReasons({ ...reasons, [l.id]: e.target.value })}
                          className="sm:col-span-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Taux annuel (ex: 0.12)"
                          value={rates[l.id] ?? ''}
                          onChange={(e) => setRates({ ...rates, [l.id]: e.target.value })}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Durée (mois)"
                          value={terms[l.id] ?? ''}
                          onChange={(e) => setTerms({ ...terms, [l.id]: e.target.value })}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {fieldErrors[l.id] && (
                        <p className="text-red-500 text-xs">{fieldErrors[l.id]}</p>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => requestDecision(l.id, true)}
                          className="text-xs bg-green-100 text-green-700 px-4 py-1.5 rounded-lg hover:bg-green-200 font-medium transition"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => requestDecision(l.id, false)}
                          className="text-xs bg-red-100 text-red-700 px-4 py-1.5 rounded-lg hover:bg-red-200 font-medium transition"
                        >
                          Rejeter
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}

            {loans.length === 0 && (
              <p className="py-6 text-slate-400 text-center text-sm">Aucune demande.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
