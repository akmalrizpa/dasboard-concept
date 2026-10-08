'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminState {
  token: string | null
  adminName: string
  adminUsername: string
  login: (token: string, name: string, username: string) => void
  logout: () => void
  isAuthed: () => boolean
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      token: null,
      adminName: '',
      adminUsername: '',
      login: (token, name, username) => set({ token, adminName: name, adminUsername: username }),
      logout: () => set({ token: null, adminName: '', adminUsername: '' }),
      isAuthed: () => get().token !== null,
    }),
    { name: 'beautyloka-admin' }
  )
)

/** Helper fetch dengan token admin */
export function adminFetch(url: string, token: string | null, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
}
