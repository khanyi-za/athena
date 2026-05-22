import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthState {
  accessToken: string | null
  user: User | null
  isInitializing: boolean
  setAuth: (accessToken: string, user: User) => void
  setAccessToken: (accessToken: string) => void
  clearAuth: () => void
  setInitializing: (value: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitializing: true,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => set({ accessToken: null, user: null }),
  setInitializing: (value) => set({ isInitializing: value }),
}))
