import { useEffect, useState } from 'react'
import api from '../api/axios'

interface AccountOption { value: string; label: string }

export function useMyAccounts() {
  const [options, setOptions] = useState<AccountOption[]>([])

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
          accounts.map((a) => ({
            value: a.id,
            label: `${a.accountNumber} — ${a.accountType} (${a.balance} ${a.currency})`,
          }))
        )
      })
      .catch(() => {})
  }, [])

  return options
}
