'use client'

import { useQueryClient } from '@tanstack/react-query'

// Single helper that busts BOTH admin queue caches after an approve/reject
// action. Useful because a first-review approval changes both queues
// implicitly: the reviewed store leaves the first-review queue immediately,
// and (later, after the merchant requests go-live) it'll show up in the
// go-live queue. Belt-and-suspenders.

const PENDING_KEY = 'admin-pending-stores'
const PENDING_GO_LIVE_KEY = 'admin-pending-go-live-stores'

export function useInvalidateAdminQueues() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: [PENDING_KEY] })
    queryClient.invalidateQueries({ queryKey: [PENDING_GO_LIVE_KEY] })
  }
}
