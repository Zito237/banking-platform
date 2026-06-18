// Dépôt : POST /deposits
import TransactionForm from '../../components/TransactionForm'

export default function DepotPage() {
  return (
    <TransactionForm
      title="Faire un dépôt"
      endpoint="/deposits"
      fields={[
        { name: 'accountId', label: 'ID du compte' },
        { name: 'amount', label: 'Montant (FCFA)', type: 'number' },
        { name: 'description', label: 'Description (optionnel)' },
      ]}
    />
  )
}
