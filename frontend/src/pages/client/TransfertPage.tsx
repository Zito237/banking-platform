// Transfert : POST /transfers
import TransactionForm from '../../components/TransactionForm'

export default function TransfertPage() {
  return (
    <TransactionForm
      title="Faire un transfert"
      endpoint="/transfers"
      fields={[
        { name: 'sourceAccountId', label: 'Compte source (ID)' },
        { name: 'targetAccountId', label: 'Compte destinataire (ID)' },
        { name: 'amount', label: 'Montant (FCFA)', type: 'number' },
        { name: 'description', label: 'Description (optionnel)' },
      ]}
    />
  )
}
