// Transfert : POST /transfers
import TransactionForm from '../../components/TransactionForm'

export default function TransfertPage() {
  return (
    <TransactionForm
      title="Faire un transfert"
      endpoint="/transfers"
      fields={[
        { name: 'sourceAccountId', label: 'Compte source (ID)' },
        { name: 'destinationAccountId', label: 'Compte destinataire (ID)' },
        { name: 'amount', label: 'Montant (FCFA)', type: 'number' },
        {
          name: 'sameOperator',
          label: 'Même opérateur que le destinataire ?',
          options: [
            { value: 'true', label: 'Oui' },
            { value: 'false', label: 'Non' },
          ],
          defaultValue: 'true',
        },
      ]}
    />
  )
}
