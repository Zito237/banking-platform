// Retrait : POST /withdrawals
import TransactionForm from '../../components/TransactionForm'
import { useMyAccounts } from '../../hooks/useMyAccounts'

export default function RetraitPage() {
  const accountOptions = useMyAccounts()

  return (
    <TransactionForm
      title="Faire un retrait"
      endpoint="/withdrawals"
      fields={[
        { name: 'accountId', label: 'Compte', options: accountOptions.length ? accountOptions : [{ value: '', label: 'Chargement...' }] },
        { name: 'amount', label: 'Montant (FCFA)', type: 'number' },
        { name: 'description', label: 'Description (optionnel)' },
      ]}
    />
  )
}
