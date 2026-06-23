import { useState, useEffect, FormEvent } from 'react'
import api from '../../api/axios'
import Card from '../../components/Card'
import { useMyAccounts } from '../../hooks/useMyAccounts'
import { parseError } from '../../api/parseError'

type Mode = 'intra' | 'inter'

interface TxResult {
  reference: string
  amount: number
  fees: number
  currency: string
  status: string
  destinationAccountId: string
}

interface AccountDetail {
  id: string
  accountNumber: string
  accountType: string
  currency: string
  operatorId: string
  balance: number
  status: string
}

export default function TransfertPage() {
  const { options, refresh } = useMyAccounts()

  const [mode, setMode] = useState<Mode>('intra')
  const [sourceId, setSourceId] = useState('')
  const [destId, setDestId] = useState('')       // intra : UUID depuis dropdown
  const [destNumber, setDestNumber] = useState('') // inter : numéro de compte saisi
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [result, setResult] = useState<TxResult | null>(null)
  const [error, setError] = useState('')
  const [destInfo, setDestInfo] = useState<{ accountNumber: string; accountType: string; currency: string; operatorId?: string } | null>(null)
  const [allAccounts, setAllAccounts] = useState<AccountDetail[]>([])

  // Charger les détails des comptes (avec operatorId)
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      if (data.linkedCustomerId) {
        api.get('/accounts', { params: { customerId: data.linkedCustomerId } })
          .then((r) => setAllAccounts(r.data))
      }
    }).catch(() => {})
  }, [])

  // Auto-sélectionne le 1er compte dès le chargement
  useEffect(() => {
    if (options.length > 0 && !sourceId) setSourceId(options[0].value)
  }, [options])

  // Lookup du compte destinataire par numéro (inter uniquement)
  useEffect(() => {
    if (mode !== 'inter' || destNumber.length < 6) { setDestInfo(null); return }
    const timer = setTimeout(async () => {
      setLookingUp(true)
      try {
        const { data } = await api.get(`/accounts/by-number/${destNumber.trim()}`)
        setDestInfo({ accountNumber: data.accountNumber, accountType: data.accountType, currency: data.currency, operatorId: data.operatorId })
        setError('')
      } catch {
        setDestInfo(null)
      } finally {
        setLookingUp(false)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [destNumber, mode])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setResult(null)
    setLoading(true)
    try {
      let destinationAccountId: string
      const sourceAccount = allAccounts.find((a) => a.id === sourceId)

      if (mode === 'intra') {
        destinationAccountId = destId
        if (destinationAccountId === sourceId) {
          setError('Le compte source et le compte destinataire doivent être différents.')
          return
        }
        const destAccount = allAccounts.find((a) => a.id === destId)
        if (sourceAccount && destAccount && sourceAccount.operatorId !== destAccount.operatorId) {
          setError('Transfert intra-opérateur : les deux comptes doivent appartenir au même opérateur. Utilisez le mode inter-opérateurs.')
          return
        }
      } else {
        const { data: acct } = await api.get(`/accounts/by-number/${destNumber.trim()}`)
        destinationAccountId = acct.id
        if (sourceAccount && acct.operatorId === sourceAccount.operatorId) {
          setError('Transfert inter-opérateurs : les deux comptes doivent appartenir à des opérateurs différents. Utilisez le mode intra-opérateur.')
          return
        }
      }

      const { data } = await api.post('/transfers', {
        sourceAccountId: sourceId,
        destinationAccountId,
        amount: Number(amount),
        sameOperator: mode === 'intra',
      })

      setResult({
        reference:            data.reference,
        amount:               data.amount,
        fees:                 data.fees ?? 0,
        currency:             data.currency ?? 'XAF',
        status:               data.status,
        destinationAccountId: data.destinationAccountId,
      })
      setAmount('')
      setDestNumber('')
      setDestId('')
      setDestInfo(null)
      refresh()
    } catch (err: any) {
      setError(parseError(err, 'Erreur lors du transfert.'))
    } finally {
      setLoading(false)
    }
  }

  const sourceAccount = allAccounts.find((a) => a.id === sourceId)
  const destOptions = options.filter((o) => {
    if (o.value === sourceId) return false
    if (mode === 'intra' && sourceAccount) {
      const destAcct = allAccounts.find((a) => a.id === o.value)
      return destAcct?.operatorId === sourceAccount.operatorId
    }
    return true
  })

  if (result) {
    const statusLabel: Record<string, string> = {
      COMPLETED:   'Réussi',
      COMPENSATED: 'Annulé (Saga compensatrice déclenchée)',
      FAILED:      'Échoué',
    }
    return (
      <Card title="Résultat du transfert" className="max-w-md">
        <div className={`rounded-xl border p-4 space-y-2 text-sm ${result.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`font-semibold ${result.status === 'COMPLETED' ? 'text-green-700' : 'text-red-700'}`}>
            {result.status === 'COMPLETED' ? '✓' : '✗'} {statusLabel[result.status] ?? result.status}
          </p>
          <div className="text-slate-600 space-y-1">
            <p><span className="text-slate-400">Référence :</span> <span className="font-mono">{result.reference}</span></p>
            <p><span className="text-slate-400">Montant envoyé :</span> {Number(result.amount).toLocaleString('fr-FR')} {result.currency}</p>
            {result.fees > 0 && (
              <p><span className="text-slate-400">Frais inter-opérateurs :</span>{' '}
                <span className="font-semibold text-orange-600">{Number(result.fees).toLocaleString('fr-FR')} {result.currency}</span>
              </p>
            )}
            {result.fees > 0 && (
              <p className="border-t border-green-200 pt-1">
                <span className="text-slate-400">Montant reçu :</span>{' '}
                <span className="font-bold text-slate-800">
                  {(Number(result.amount) - Number(result.fees)).toLocaleString('fr-FR')} {result.currency}
                </span>
              </p>
            )}
            {result.status === 'COMPENSATED' && (
              <p className="text-xs text-orange-600 bg-orange-50 rounded p-2 mt-2">
                Le débit a été annulé automatiquement par la saga compensatrice — aucun fonds n'a été perdu.
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setResult(null)}
          className="mt-4 w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition"
        >
          Nouveau transfert
        </button>
      </Card>
    )
  }

  return (
    <Card title="Faire un transfert" className="max-w-md">
      {/* Toggle mode */}
      <div className="flex rounded-lg border border-slate-200 overflow-hidden mb-4">
        {(['intra', 'inter'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(''); setDestInfo(null) }}
            className={`flex-1 py-2 text-sm font-medium transition ${
              mode === m ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {m === 'intra' ? 'Intra-opérateur' : 'Inter-opérateurs'}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 mb-4">
        {mode === 'intra'
          ? 'Transfert entre vos propres comptes, sans frais.'
          : 'Transfert vers un compte d\'un autre client. Des frais de commission s\'appliquent.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Compte source */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Compte source</label>
          <select
            required
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {options.length === 0 && <option value="">Chargement...</option>}
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Compte destinataire */}
        {mode === 'intra' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Compte destinataire</label>
            <select
              required
              value={destId}
              onChange={(e) => setDestId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un compte...</option>
              {destOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de compte destinataire</label>
            <input
              required
              type="text"
              placeholder="ex: ACC1718123456789"
              value={destNumber}
              onChange={(e) => setDestNumber(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {lookingUp && <p className="text-xs text-slate-400 mt-1">Vérification...</p>}
            {destInfo && !lookingUp && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Compte trouvé — {destInfo.accountType} ({destInfo.currency})
              </p>
            )}
            {destNumber.length >= 6 && !destInfo && !lookingUp && (
              <p className="text-xs text-slate-400 mt-1">Numéro de compte non trouvé.</p>
            )}
          </div>
        )}

        {/* Montant */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Montant</label>
          <input
            required
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {mode === 'inter' && (
          <p className="text-xs text-orange-600 bg-orange-50 rounded p-2">
            Des frais de commission seront prélevés sur ce transfert (calculés par l'opérateur).
          </p>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || (mode === 'inter' && destNumber.length < 6)}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Envoi...' : 'Valider le transfert'}
        </button>
      </form>
    </Card>
  )
}
