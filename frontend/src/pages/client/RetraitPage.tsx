// Retrait : POST /withdrawals
import TransactionForm from '../../components/TransactionForm'

export default function RetraitPage() {
  return (
    <TransactionForm
      title="Faire un retrait"
      endpoint="/withdrawals"
      fields={[
        { name: 'accountId', label: 'ID du compte' },
        { name: 'amount', label: 'Montant (FCFA)', type: 'number' },
        { name: 'description', label: 'Description (optionnel)' },
      ]}
    />
  )
}
