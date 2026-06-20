import TransactionForm from '../../components/TransactionForm'
import { useMyAccounts } from '../../hooks/useMyAccounts'

export default function RetraitPage() {
  const { options, refresh } = useMyAccounts()
  const opts = options.length ? options : [{ value: '', label: 'Chargement...' }]

  return (
    <TransactionForm
      title="Faire un retrait"
      endpoint="/withdrawals"
      onSuccess={refresh}
      fields={[
        { name: 'accountId', label: 'Compte', options: opts },
        { name: 'amount', label: 'Montant', type: 'number' },
        { name: 'description', label: 'Description (optionnel)' },
      ]}
    />
  )
}
