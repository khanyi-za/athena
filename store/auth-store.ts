import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthState {
  accessToken: string | null
  user: User | null
  isInitializing: boolean
  setAuth: (accessToken: string, user: User) => void
  clearAuth: () => void
  setInitializing: (value: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitializing: true,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
  setInitializing: (value) => set({ isInitializing: value }),
}))
