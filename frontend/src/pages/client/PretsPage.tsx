import { useEffect, useState, FormEvent } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'
import LoanScheduleTable from '../../components/LoanScheduleTable'
import { parseError } from '../../api/parseError'

interface Operator { id: string; name: string; code: string }

interface LoanApplication {
  id: string
  customerId: string
  operatorId?: string
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

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  SUBMITTED:    { color: 'bg-yellow-100 text-yellow-700', label: 'Soumis'    },
  UNDER_REVIEW: { color: 'bg-blue-100   text-blue-700',   label: 'En examen' },
  APPROVED:     { color: 'bg-green-100  text-green-700',  label: 'Approuvé'  },
  REJECTED:     { color: 'bg-red-100    text-red-700',    label: 'Rejeté'    },
}

export default function PretsPage() {
  const [loans, setLoans] = useState<LoanApplication[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Schedule state: loanId → LoanSchedule | 'loading' | 'error'
  const [schedules, setSchedules] = useState<Record<string, LoanSchedule | 'loading' | 'error'>>({})
  const [openSchedule, setOpenSchedule] = useState<Record<string, boolean>>({})

  const fetchLoans = (custId: string) =>
    api.get('/loans', { params: { customerId: custId } }).then((r) => setLoans(r.data))

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        if (!data.linkedCustomerId) {
          setError("Aucun profil client n'est encore associé à votre compte.")
          return
        }
        setCustomerId(data.linkedCustomerId)
        return Promise.all([
          fetchLoans(data.linkedCustomerId),
          api.get('/operators').then((r) => setOperators(r.data)),
        ])
      })
      .catch(() => setError('Impossible de charger vos prêts.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg(''); setError('')
    if (!customerId) return
    try {
      await api.post('/loans', { customerId, operatorId, requestedAmount: Number(amount), purpose })
      setMsg('Demande soumise avec succès.')
      setAmount(''); setPurpose(''); setOperatorId('')
      fetchLoans(customerId)
    } catch (err: any) {
      setError(parseError(err, 'Impossible de soumettre la demande.'))
    }
  }

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

  return (
    <div className="space-y-6">
      <Card title="Demander un prêt" className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Opérateur</label>
            <select
              required
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un opérateur...</option>
              {operators.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Montant demandé (FCFA)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Objet du prêt</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!customerId}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Soumettre
          </button>
        </form>
      </Card>

      <Card title="Mes demandes de prêt">
        {loading ? (
          <p className="text-slate-400 text-sm">Chargement...</p>
        ) : (
          <div className="space-y-3">
            {loans.map((l) => {
              const s = STATUS_STYLE[l.status] ?? { color: 'bg-slate-100 text-slate-600', label: l.status }
              const isApproved = l.status === 'APPROVED'
              const scheduleOpen = openSchedule[l.id]
              const schedule = schedules[l.id]

              return (
                <div key={l.id} className="border border-slate-100 rounded-xl p-4 space-y-2 hover:border-slate-200 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {Number(l.requestedAmount).toLocaleString('fr-FR')} FCFA
                        <span className="font-normal text-slate-500"> — {l.purpose}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {l.operatorId && (
                          <span className="text-slate-500 font-medium">
                            {operators.find((o) => o.id === l.operatorId)?.name ?? ''} · {' '}
                          </span>
                        )}
                        Soumis le {new Date(l.submittedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${s.color}`}>
                      {s.label}
                    </span>
                  </div>

                  {l.decisionReason && (
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                      <span className="font-medium">Motif :</span> {l.decisionReason}
                    </p>
                  )}

                  {isApproved && (
                    <div>
                      <button
                        onClick={() => toggleSchedule(l.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                      >
                        {scheduleOpen ? '▲ Masquer l\'échéancier' : '▼ Voir l\'échéancier'}
                      </button>

                      {scheduleOpen && (
                        schedule === 'loading' ? (
                          <p className="text-xs text-slate-400 mt-2">Chargement de l'échéancier...</p>
                        ) : schedule === 'error' ? (
                          <p className="text-xs text-red-500 mt-2">Impossible de charger l'échéancier.</p>
                        ) : schedule ? (
                          <LoanScheduleTable loan={schedule} />
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {loans.length === 0 && (
              <p className="py-4 text-slate-400 text-center text-sm">Aucune demande de prêt.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
