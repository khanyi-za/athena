'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'

import { useStoreMe } from '@/hooks/use-store-me'
import {
  useConversationMessages,
  useInvalidateConversations,
  useStoreConversations,
} from '@/hooks/use-store-conversations'
import {
  markConversationRead,
  sendConversationMessage,
} from '@/lib/api/chat'
import { openChatSocket } from '@/lib/chat-socket'
import type { ChatMessage, ConversationSummary } from '@/lib/schemas/chat'

// Messages — merchant side of the buyer↔merchant chat (REST writes +
// socket.io realtime, same /chat namespace the buyer app uses). Two-pane
// inbox: conversation list left, live thread right.

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function timeAgo(date: Date): string {
  const ms = Date.now() - date.getTime()
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}

export default function MessagesPage() {
  const { data: store } = useStoreMe()
  const conversationsQuery = useStoreConversations(store?.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const conversations = conversationsQuery.data ?? []
  const selected = conversations.find((c) => c.id === selectedId) ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground">Customer conversations from the YIIVA app</p>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[640px]">
          {/* Conversation list */}
          <div className="border-r border-border overflow-y-auto">
            {conversationsQuery.isPending ? (
              <div className="p-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : conversationsQuery.isError ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Couldn&apos;t load conversations.
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No messages yet</p>
                <p className="text-xs text-muted-foreground">
                  When buyers message your brand from the app, conversations
                  appear here.
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === selectedId}
                  onSelect={() => setSelectedId(conversation.id)}
                />
              ))
            )}
          </div>

          {/* Thread */}
          <div className="md:col-span-2 flex flex-col">
            {selected && store ? (
              <ConversationThread
                key={selected.id}
                storeId={store.id}
                conversation={selected}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare size={40} className="text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a conversation to read and reply.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ConversationRow({
  conversation,
  active,
  onSelect,
}: {
  conversation: ConversationSummary
  active: boolean
  onSelect: () => void
}) {
  const preview = conversation.lastMessage
    ? `${conversation.lastMessage.sender === 'merchant' ? 'You: ' : ''}${
        conversation.lastMessage.text ?? '📷 Photo'
      }`
    : 'No messages yet'

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
        active ? 'bg-brand-subtle' : 'hover:bg-accent'
      }`}
    >
      <div className="flex items-center gap-3">
        {conversation.buyer.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={conversation.buyer.avatar}
            alt={conversation.buyer.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <span className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
            {conversation.buyer.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`text-sm truncate ${
                conversation.unreadCount > 0
                  ? 'font-semibold text-foreground'
                  : 'font-medium text-foreground'
              }`}
            >
              {conversation.buyer.name}
            </p>
            {conversation.lastMessageAt && (
              <span className="text-xs text-muted-foreground shrink-0">
                {timeAgo(conversation.lastMessageAt)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p
              className={`text-xs truncate ${
                conversation.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {preview}
            </p>
            {conversation.unreadCount > 0 && (
              <span className="shrink-0 min-w-5 h-5 px-1.5 bg-brand text-brand-foreground rounded-full text-[11px] font-semibold flex items-center justify-center">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

function ConversationThread({
  storeId,
  conversation,
}: {
  storeId: string
  conversation: ConversationSummary
}) {
  const conversationId = conversation.id
  const historyQuery = useConversationMessages(storeId, conversationId)
  const invalidateConversations = useInvalidateConversations(storeId)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const appendUnique = useCallback((message: ChatMessage) => {
    setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, message],
    )
  }, [])

  // Seed from history.
  useEffect(() => {
    if (historyQuery.data) setMessages(historyQuery.data)
  }, [historyQuery.data])

  // Realtime + read state.
  useEffect(() => {
    const cleanup = openChatSocket(conversationId, (message) => {
      appendUnique(message)
      if (message.sender === 'user') {
        void markConversationRead(storeId, conversationId).catch(() => {})
        invalidateConversations()
      }
    })
    void markConversationRead(storeId, conversationId)
      .catch(() => {})
      .finally(invalidateConversations)
    return () => cleanup?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, storeId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    const idempotencyKey = uuid()
    const tempId = `local-${idempotencyKey}`
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId,
      sender: 'merchant',
      senderId: 'me',
      text,
      attachments: [],
      orderRef: null,
      status: 'sent',
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, optimistic])
    setInput('')
    setSending(true)

    try {
      const message = await sendConversationMessage(
        storeId,
        conversationId,
        text,
        idempotencyKey,
      )
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId)
        return withoutTemp.some((m) => m.id === message.id)
          ? withoutTemp
          : [...withoutTemp, message]
      })
      invalidateConversations()
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Thread header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        {conversation.buyer.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={conversation.buyer.avatar}
            alt={conversation.buyer.name}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <span className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
            {conversation.buyer.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">{conversation.buyer.name}</p>
          <p className="text-xs text-muted-foreground">Buyer on YIIVA</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {historyQuery.isPending ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted w-2/3" />
            ))}
          </div>
        ) : (
          messages.map((message) => {
            const mine = message.sender === 'merchant'
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    mine
                      ? 'bg-brand text-brand-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  {message.attachments.map((attachment, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${message.id}-att-${index}`}
                      src={attachment.thumbnailUrl ?? attachment.url}
                      alt="Attachment"
                      className="rounded-lg mb-1.5 max-w-full max-h-64 object-cover"
                    />
                  ))}
                  {message.text && (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  )}
                  <p
                    className={`text-[11px] mt-1 ${
                      mine ? 'text-brand-foreground/70' : 'text-muted-foreground'
                    } text-right`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder={`Reply to ${conversation.buyer.name}…`}
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:border-ring focus:ring-ring text-sm max-h-32 placeholder:text-muted-foreground"
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || sending}
            className="p-2.5 bg-brand text-brand-foreground rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  )
}
