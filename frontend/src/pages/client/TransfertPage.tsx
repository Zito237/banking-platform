// Transfert : POST /transfers
import TransactionForm from '../../components/TransactionForm'
import { useMyAccounts } from '../../hooks/useMyAccounts'

export default function TransfertPage() {
  const accountOptions = useMyAccounts()
  const opts = accountOptions.length ? accountOptions : [{ value: '', label: 'Chargement...' }]

  return (
    <TransactionForm
      title="Faire un transfert"
      endpoint="/transfers"
      fields={[
        { name: 'sourceAccountId', label: 'Compte source', options: opts },
        { name: 'destinationAccountId', label: 'Compte destinataire', options: opts },
        { name: 'amount', label: 'Montant (FCFA)', type: 'number' },
        {
          name: 'sameOperator',
          label: 'Même opérateur ?',
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
