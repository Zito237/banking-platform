import TransactionForm from '../../components/TransactionForm'
import { useMyAccounts } from '../../hooks/useMyAccounts'

export default function DepotPage() {
  const { options, refresh } = useMyAccounts()
  const opts = options.length ? options : [{ value: '', label: 'Chargement...' }]

  return (
    <TransactionForm
      title="Faire un dépôt"
      endpoint="/deposits"
      onSuccess={refresh}
      fields={[
        { name: 'accountId', label: 'Compte', options: opts },
        { name: 'amount', label: 'Montant', type: 'number' },
        { name: 'description', label: 'Description (optionnel)' },
      ]}
    />
  )
}
