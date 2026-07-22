import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPayoutAccount,
  getPayoutBanks,
  setPayoutAccount,
} from '@/lib/api/payout-account'
import type { SetPayoutAccountInput } from '@/lib/schemas/payout-account'

export function usePayoutAccount(storeId: string) {
  return useQuery({
    queryKey: ['payout-account', storeId],
    queryFn: () => getPayoutAccount(storeId),
  })
}

export function usePayoutBanks(storeId: string) {
  return useQuery({
    queryKey: ['payout-banks'],
    queryFn: () => getPayoutBanks(storeId),
    staleTime: 24 * 60 * 60 * 1000, // the SA bank list barely changes
  })
}

export function useSetPayoutAccount(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SetPayoutAccountInput) =>
      setPayoutAccount(storeId, input),
    onSuccess: (view) => {
      queryClient.setQueryData(['payout-account', storeId], view)
    },
  })
}
