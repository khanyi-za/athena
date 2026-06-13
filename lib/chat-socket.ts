// socket.io client for nuwa's /chat namespace. The WebSocket goes straight to
// the backend (not through the Next BFF — sockets can't proxy through route
// handlers); the JWT access token rides in the handshake auth payload.
//
// NEXT_PUBLIC_API_URL must point at the backend origin in deployed envs;
// locally it defaults to nuwa's dev port.

import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth-store'
import { chatMessageSchema, type ChatMessage } from '@/lib/schemas/chat'

const CHAT_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

/**
 * Connect, join the conversation room, and stream message:new events.
 * Returns a cleanup (leave + disconnect) for the caller's effect teardown.
 * Returns null when there's no access token (caller skips realtime).
 */
export function openChatSocket(
  conversationId: string,
  onMessage: (message: ChatMessage) => void,
): (() => void) | null {
  const token = useAuthStore.getState().accessToken
  if (!token) return null

  const socket: Socket = io(`${CHAT_ORIGIN}/chat`, {
    auth: { token },
    transports: ['websocket'],
  })

  socket.on('connect', () => {
    socket.emit('join', { conversationId })
  })

  socket.on('message:new', (raw: unknown) => {
    const parsed = chatMessageSchema.safeParse(raw)
    if (parsed.success && parsed.data.conversationId === conversationId) {
      onMessage(parsed.data)
    }
  })

  return () => {
    socket.emit('leave', { conversationId })
    socket.disconnect()
  }
}
