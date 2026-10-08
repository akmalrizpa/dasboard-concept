'use client'

import { create } from 'zustand'
import type { SettingsMap, FlashWindow, Article } from '@/lib/types'

/** Helper pembaca setting dengan nilai default aman */
export function getSetting<T>(settings: SettingsMap | null | undefined, key: string, fallback: T): T {
  if (!settings || !(key in settings)) return fallback
  const v = settings[key]
  return (v as T) ?? fallback
}

interface SiteState {
  /** Semua pengaturan toko dari DB (dinamis) */
  settings: SettingsMap | null
  /** Jendela flash sale aktif */
  flashWindow: FlashWindow | null
  /** Artikel Beauty Journal */
  articles: Article[]
  /** Versi konfigurasi — dinaikkan setiap kali admin menyimpan perubahan */
  version: number
  setSiteConfig: (settings: SettingsMap, flashWindow: FlashWindow | null, articles: Article[]) => void
  bumpVersion: () => void
}

export const useSiteStore = create<SiteState>((set) => ({
  settings: null,
  flashWindow: null,
  articles: [],
  version: 0,
  setSiteConfig: (settings, flashWindow, articles) => set({ settings, flashWindow, articles }),
  bumpVersion: () => set((s) => ({ version: s.version + 1 })),
}))
