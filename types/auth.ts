export type StoreStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED'

export interface UserStore {
  id: string
  status: StoreStatus
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'BUYER' | 'MERCHANT' | 'ADMIN'
  avatarUrl: string | null
  store: UserStore | null
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface ApiErrorBody {
  statusCode: number
  message: string | string[]
  error: string
}
