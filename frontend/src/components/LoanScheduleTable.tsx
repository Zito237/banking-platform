interface Installment {
  id: string
  dueDate: string
  amount: number
  principalPart: number
  interestPart: number
  status: string
  paidAt?: string
}

interface LoanInfo {
  principal: number
  interestRate: number
  termMonths: number
  installments: Installment[]
}

const INST_STATUS: Record<string, { label: string; classes: string }> = {
  PENDING:  { label: 'À payer',  classes: 'bg-yellow-100 text-yellow-700' },
  PAID:     { label: 'Payée',    classes: 'bg-green-100  text-green-700'  },
  OVERDUE:  { label: 'En retard',classes: 'bg-red-100    text-red-600'    },
}

export default function LoanScheduleTable({ loan }: { loan: LoanInfo }) {
  const totalInterest = loan.installments.reduce((s, i) => s + Number(i.interestPart), 0)
  const totalAmount   = loan.installments.reduce((s, i) => s + Number(i.amount), 0)
  const paid          = loan.installments.filter((i) => i.status === 'PAID').length

  return (
    <div className="mt-3 space-y-3">
      {/* Résumé */}
      <div className="grid grid-cols-3 gap-2 text-xs bg-blue-50 rounded-lg p-3">
        <div>
          <p className="text-slate-400">Capital</p>
          <p className="font-semibold text-slate-700">{Number(loan.principal).toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div>
          <p className="text-slate-400">Taux annuel</p>
          <p className="font-semibold text-slate-700">{(loan.interestRate * 100).toFixed(1)} %</p>
        </div>
        <div>
          <p className="text-slate-400">Durée</p>
          <p className="font-semibold text-slate-700">{loan.termMonths} mois</p>
        </div>
        <div>
          <p className="text-slate-400">Total intérêts</p>
          <p className="font-semibold text-slate-700">{totalInterest.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div>
          <p className="text-slate-400">Coût total</p>
          <p className="font-semibold text-slate-700">{totalAmount.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div>
          <p className="text-slate-400">Payées</p>
          <p className="font-semibold text-slate-700">{paid} / {loan.termMonths}</p>
        </div>
      </div>

      {/* Tableau des échéances */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="pb-1 pr-2">N°</th>
              <th className="pb-1 pr-2">Échéance</th>
              <th className="pb-1 pr-2 text-right">Mensualité</th>
              <th className="pb-1 pr-2 text-right">Capital</th>
              <th className="pb-1 pr-2 text-right">Intérêts</th>
              <th className="pb-1">Statut</th>
            </tr>
          </thead>
          <tbody>
            {loan.installments.map((inst, idx) => {
              const s = INST_STATUS[inst.status] ?? { label: inst.status, classes: 'bg-slate-100 text-slate-600' }
              return (
                <tr key={inst.id} className={`border-b last:border-0 ${inst.status === 'PAID' ? 'opacity-60' : ''}`}>
                  <td className="py-1.5 pr-2 text-slate-400">{idx + 1}</td>
                  <td className="py-1.5 pr-2 text-slate-600 whitespace-nowrap">
                    {new Date(inst.dueDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-semibold text-slate-700">
                    {Number(inst.amount).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-1.5 pr-2 text-right text-slate-500">
                    {Number(inst.principalPart).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-1.5 pr-2 text-right text-slate-500">
                    {Number(inst.interestPart).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-1.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded-full font-medium ${s.classes}`}>
                      {s.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
