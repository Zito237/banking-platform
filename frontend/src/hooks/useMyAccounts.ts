import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'

interface AccountOption { value: string; label: string }

export function useMyAccounts() {
  const [options, setOptions] = useState<AccountOption[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        const customerId = data.linkedCustomerId
        if (!customerId) return
        return api.get('/accounts', { params: { customerId } })
      })
      .then((res) => {
        if (!res) return
        const accounts: any[] = res.data
        setOptions(
          accounts
            .filter((a) => a.status === 'ACTIVE')
            .map((a) => ({
              value: a.id,
              label: `${a.accountNumber} — ${a.accountType === 'CURRENT' ? 'Courant' : a.accountType === 'SAVINGS' ? 'Épargne' : 'Portefeuille'} (${Number(a.balance).toLocaleString('fr-FR')} ${a.currency})`,
            }))
        )
      })
      .catch(() => {})
  }, [refreshKey])

  return { options, refresh }
}
