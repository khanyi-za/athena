import { apiFetch } from '@/lib/api-client'
import {
  chatMessageSchema,
  conversationListSchema,
  messagesResponseSchema,
  type ChatMessage,
  type ConversationSummary,
} from '@/lib/schemas/chat'

// Typed client for the merchant chat surface, via the Next proxy routes.

export async function getConversations(
  storeId: string,
): Promise<ConversationSummary[]> {
  const data = await apiFetch<unknown>(`/api/stores/${storeId}/conversations`, {
    method: 'GET',
  })
  return conversationListSchema.parse(data).conversations
}

export async function getConversationMessages(
  storeId: string,
  conversationId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/conversations/${conversationId}/messages?limit=${limit}`,
    { method: 'GET' },
  )
  return messagesResponseSchema.parse(data).messages
}

/** Reply as the store. Idempotency-Key makes retries safe (replays dedupe). */
export async function sendConversationMessage(
  storeId: string,
  conversationId: string,
  text: string,
  idempotencyKey: string,
): Promise<ChatMessage> {
  const data = await apiFetch<{ message: unknown }>(
    `/api/stores/${storeId}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ text }),
    },
  )
  return chatMessageSchema.parse(data.message)
}

export async function markConversationRead(
  storeId: string,
  conversationId: string,
): Promise<void> {
  await apiFetch(`/api/stores/${storeId}/conversations/${conversationId}/read`, {
    method: 'PATCH',
  })
}
