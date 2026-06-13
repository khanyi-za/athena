'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getConversations, getConversationMessages } from '@/lib/api/chat'

export function useStoreConversations(storeId: string | undefined) {
  return useQuery({
    queryKey: ['store-conversations', storeId],
    queryFn: () => getConversations(storeId as string),
    enabled: !!storeId,
    staleTime: 15 * 1000,
    // Fallback freshness for list previews/unread counts; the open thread
    // itself is realtime via the socket.
    refetchInterval: 30 * 1000,
  })
}

export function useConversationMessages(
  storeId: string | undefined,
  conversationId: string | null,
) {
  return useQuery({
    queryKey: ['store-conversation-messages', storeId, conversationId],
    queryFn: () =>
      getConversationMessages(storeId as string, conversationId as string),
    enabled: !!storeId && !!conversationId,
    staleTime: 15 * 1000,
  })
}

export function useInvalidateConversations(storeId: string | undefined) {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: ['store-conversations', storeId] })
}
