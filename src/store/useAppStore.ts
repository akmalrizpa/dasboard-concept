'use client'

import { create } from 'zustand'

/** Navigasi SPA BeautyLoka */
export type View =
  | { name: 'home' }
  | { name: 'products'; categorySlug?: string; brandSlug?: string; query?: string; flash?: boolean; title?: string }
  | { name: 'product'; slug: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'success'; orderNumber: string; total: number; paymentMethod: string }
  | { name: 'track' }
  | { name: 'admin-login' }
  | { name: 'admin-dashboard' }
  | { name: 'admin-products' }
  | { name: 'admin-orders' }
  | { name: 'admin-customers' }
  | { name: 'admin-categories' }
  | { name: 'admin-vouchers' }
  | { name: 'admin-settings' }

interface AppState {
  view: View
  navigate: (view: View) => void
  goHome: () => void
}

export const useAppStore = create<AppState>((set) => ({
  view: { name: 'home' },
  navigate: (view) => {
    set({ view })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
  },
  goHome: () => {
    set({ view: { name: 'home' } })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
  },
}))
