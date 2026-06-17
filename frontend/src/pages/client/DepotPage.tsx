// Dépôt : POST /deposits
import TransactionForm from '../../components/TransactionForm'
import { useMyAccounts } from '../../hooks/useMyAccounts'

export default function DepotPage() {
  const accountOptions = useMyAccounts()

  return (
    <TransactionForm
      title="Faire un dépôt"
      endpoint="/deposits"
      fields={[
        { name: 'accountId', label: 'Compte', options: accountOptions.length ? accountOptions : [{ value: '', label: 'Chargement...' }] },
        { name: 'amount', label: 'Montant (FCFA)', type: 'number' },
        { name: 'description', label: 'Description (optionnel)' },
      ]}
    />
  )
}
