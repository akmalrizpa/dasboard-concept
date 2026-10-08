 
'use client'

import { useState } from 'react'
import { useAppStore, View } from '@/store/useAppStore'
import { useCartStore } from '@/store/useCartStore'
import { useSiteStore, getSetting } from '@/store/useSiteStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  Search,
  ShoppingCart,
  Heart,
  Menu,
  Package,
  ChevronRight,
  ShieldCheck,
  Truck,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

interface HeaderProps {
  categories: Category[]
}

export default function Header({ categories }: HeaderProps) {
  const navigate = useAppStore((s) => s.navigate)
  const view = useAppStore((s) => s.view)
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const settings = useSiteStore((s) => s.settings)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  // ===== Konten dinamis dari pengaturan =====
  const siteName = getSetting<string>(settings, 'site.name', 'BeautyLoka')
  const searchPlaceholder = getSetting<string>(settings, 'site.searchPlaceholder', 'Cari produk...')
  const promoTexts = getSetting<string[]>(settings, 'announcement.texts', [])
  const announcementActive = getSetting<boolean>(settings, 'announcement.active', true)

  // Nama toko bisa 2 bagian (contoh: "Beauty" + "Loka") — warna kedua mengikuti primary
  const nameParts = siteName.includes(' ')
    ? [siteName.slice(0, siteName.indexOf(' ')), siteName.slice(siteName.indexOf(' ') + 1)]
    : [siteName, '']

  const isStorefront = !view.name.startsWith('admin')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate({ name: 'products', query: searchQuery.trim(), title: `"${searchQuery.trim()}"` })
    setMobileSearchOpen(false)
  }

  const goToCategory = (slug: string, name: string) => {
    navigate({ name: 'products', categorySlug: slug, title: name })
  }

  const navItems = [
    ...categories.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon })),
    { slug: 'semua', name: 'Semua Produk', icon: '🛍️' },
  ]

  const promoText = promoTexts.length > 0 ? [...promoTexts, ...promoTexts].join('  •  ') : ''

  if (!isStorefront) return null

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Promo marquee bar (teks dari pengaturan admin) */}
      {announcementActive && promoTexts.length > 0 && (
        <div className="bg-neutral-900 text-white overflow-hidden">
          <div className="flex whitespace-nowrap py-1.5 text-xs animate-marquee">
            <span className="px-4">{promoText}</span>
            <span className="px-4">{promoText}</span>
          </div>
        </div>
      )}

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 py-3 md:gap-6 md:py-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
              <div className="flex items-center gap-2 border-b p-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg tracking-tight">
                  {nameParts[0]}
                  {nameParts[1] && <span className="text-primary">{nameParts[1]}</span>}
                </span>
              </div>
              <nav className="p-2" aria-label="Kategori produk">
                {navItems.map((item) => (
                  <button
                    key={item.slug}
                    onClick={() =>
                      item.slug === 'semua'
                        ? navigate({ name: 'products', title: 'Semua Produk' })
                        : goToCategory(item.slug, item.name)
                    }
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span aria-hidden>{item.icon || '✨'}</span>
                      {item.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
                <div className="mt-2 border-t pt-2">
                  <button
                    onClick={() => navigate({ name: 'track' })}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <Package className="h-4 w-4" /> Lacak Pesanan
                  </button>
                  <button
                    onClick={() => navigate({ name: 'admin-login' })}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" /> Dasbor Admin
                  </button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo (nama toko dari pengaturan) */}
          <button
            onClick={() => navigate({ name: 'home' })}
            className="flex items-center gap-1.5 shrink-0"
            aria-label={`${siteName} - kembali ke beranda`}
          >
            <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            <span className="font-bold text-lg md:text-2xl tracking-tight">
              {nameParts[0]}
              {nameParts[1] && <span className="text-primary">{nameParts[1]}</span>}
            </span>
          </button>

          {/* Search (desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl relative"
            role="search"
          >
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-full border-neutral-200 bg-neutral-50 pr-12 pl-4 h-11 focus-visible:ring-primary"
              aria-label="Cari produk"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1 h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
              aria-label="Cari"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-0.5 md:gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Cari produk"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex relative"
              onClick={() => navigate({ name: 'track' })}
              aria-label="Lacak pesanan"
              title="Lacak Pesanan"
            >
              <Package className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate({ name: 'cart' })}
              aria-label={`Keranjang belanja, ${cartCount} item`}
              title="Keranjang"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        {mobileSearchOpen && (
          <form onSubmit={handleSearch} className="pb-3 md:hidden relative" role="search">
            <Input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-full border-neutral-200 bg-neutral-50 pr-12"
              aria-label="Cari produk"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary"
              aria-label="Cari"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>

      {/* Category nav (desktop) */}
      <nav
        className="hidden lg:block border-t border-neutral-100"
        aria-label="Navigasi kategori"
      >
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const active =
                view.name === 'products' &&
                (item.slug === 'semua'
                  ? !('categorySlug' in view && view.categorySlug)
                  : 'categorySlug' in view && view.categorySlug === item.slug)
              return (
                <li key={item.slug}>
                  <button
                    onClick={() =>
                      item.slug === 'semua'
                        ? navigate({ name: 'products', title: 'Semua Produk' })
                        : goToCategory(item.slug, item.name)
                    }
                    className={cn(
                      'flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium border-b-2 border-transparent transition-colors hover:text-primary hover:border-primary/30',
                      active ? 'text-primary border-primary' : 'text-neutral-700'
                    )}
                  >
                    <span aria-hidden className="text-xs">
                      {item.icon || '✨'}
                    </span>
                    {item.name}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </header>
  )
}
