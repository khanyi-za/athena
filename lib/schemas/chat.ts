import { z } from 'zod'

// Merchant chat shapes (nuwa /stores/:storeId/conversations surface — raw,
// not the mobile envelope). Message vocabulary: sender 'user' = the buyer,
// 'merchant' = anyone managing this store.

export const chatAttachmentSchema = z.object({
  type: z.literal('image'),
  url: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
})

export type ChatAttachment = z.infer<typeof chatAttachmentSchema>

export const chatMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  sender: z.enum(['user', 'merchant']),
  senderId: z.string(),
  text: z.string().nullable(),
  attachments: z.array(chatAttachmentSchema).catch([]),
  orderRef: z.string().nullable(),
  status: z.string(),
  createdAt: z.coerce.date(),
})

export type ChatMessage = z.infer<typeof chatMessageSchema>

export const conversationSummarySchema = z.object({
  id: z.string(),
  buyer: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().nullable(),
  }),
  lastMessage: z
    .object({
      text: z.string().nullable(),
      sender: z.enum(['user', 'merchant']),
      at: z.coerce.date(),
    })
    .nullable(),
  lastMessageAt: z.coerce.date().nullable(),
  unreadCount: z.coerce.number(),
})

export type ConversationSummary = z.infer<typeof conversationSummarySchema>

export const conversationListSchema = z.object({
  conversations: z.array(conversationSummarySchema),
})

export const messagesResponseSchema = z.object({
  messages: z.array(chatMessageSchema),
})
