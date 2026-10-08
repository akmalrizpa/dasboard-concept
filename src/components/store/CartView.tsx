 
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight, Tag, TicketPercent } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useCartStore } from '@/store/useCartStore'
import { useSiteStore, getSetting } from '@/store/useSiteStore'
import { formatIDR } from '@/lib/format'
import Link from 'next/link'
import type { CheckoutConfig } from '@/lib/types'

export default function CartView() {
  const navigate = useAppStore((s) => s.navigate)
  const settings = useSiteStore((s) => s.settings)
  const { items, removeItem, updateQuantity, clearCart } = useCartStore()
  const [clearConfirm, setClearConfirm] = useState(false)
  const [config, setConfig] = useState<CheckoutConfig | null>(null)

  // Ambil konfigurasi ongkir & voucher dari server (dinamis)
  useEffect(() => {
    let cancelled = false
    fetch('/api/checkout/config')
      .then(async (res) => {
        if (!res.ok) throw new Error('Gagal memuat konfigurasi')
        return res.json()
      })
      .then((data: CheckoutConfig) => {
        if (!cancelled) setConfig(data)
      })
      .catch((e) => console.error(e))
    return () => {
      cancelled = true
    }
  }, [])

  // Batas gratis ongkir dinamis dari pengaturan
  const FREE_SHIPPING_THRESHOLD = getSetting<number>(settings, 'shipping.freeThreshold', 0)
  const minShippingCost = config ? Math.min(...config.shippingMethods.map((m) => m.cost)) : null

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const freeShipping = FREE_SHIPPING_THRESHOLD > 0 && subtotal >= FREE_SHIPPING_THRESHOLD
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  if (items.length === 0) {
    return (
      <main className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
          <ShoppingCart className="h-10 w-10 text-primary" aria-hidden />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Keranjangmu masih kosong</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Yuk, isi dengan produk kecantikan favoritmu! Ada banyak promo menarik menunggu.
        </p>
        <Button
          onClick={() => navigate({ name: 'products', title: 'Semua Produk' })}
          className="mt-6 rounded-full bg-primary px-8 hover:bg-primary/90"
        >
          Mulai Belanja <ArrowRight className="h-4 w-4" />
        </Button>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-6 animate-fade-in-up">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">
          Keranjang Belanja <span className="text-base font-normal text-muted-foreground">({totalItems} produk)</span>
        </h1>
        {clearConfirm ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Kosongkan keranjang?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                clearCart()
                setClearConfirm(false)
              }}
            >
              Ya, kosongkan
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setClearConfirm(false)}>
              Batal
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setClearConfirm(true)}>
            <Trash2 className="h-4 w-4" /> Kosongkan
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* List item */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <Card key={item.productId} className="overflow-hidden">
              <CardContent className="flex gap-4 p-4">
                <button
                  onClick={() => navigate({ name: 'product', slug: item.slug })}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-50"
                  aria-label={`Lihat ${item.name}`}
                >
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                    {item.brand}
                  </p>
                  <button
                    onClick={() => navigate({ name: 'product', slug: item.slug })}
                    className="mt-0.5 line-clamp-2 text-left text-sm font-medium hover:text-primary"
                  >
                    {item.name}
                  </button>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="flex items-center rounded-lg border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        aria-label="Kurangi jumlah"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label="Tambah jumlah"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="text-right">
                      {item.originalPrice && item.originalPrice > item.price && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatIDR(item.originalPrice * item.quantity)}
                        </p>
                      )}
                      <p className="font-bold text-primary">
                        {formatIDR(item.price * item.quantity)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.productId)}
                      aria-label={`Hapus ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="ghost"
            onClick={() => navigate({ name: 'products', title: 'Semua Produk' })}
            className="text-primary"
          >
            + Tambah produk lain
          </Button>
        </div>

        {/* Ringkasan */}
        <div className="lg:sticky lg:top-40 lg:self-start">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ringkasan Belanja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({totalItems} item)</span>
                <span className="font-semibold">{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pengiriman</span>
                <span className={freeShipping ? 'font-semibold text-emerald-600' : 'font-semibold'}>
                  {freeShipping
                    ? 'GRATIS'
                    : minShippingCost !== null
                      ? `Mulai ${formatIDR(minShippingCost)}`
                      : 'Dihitung saat checkout'}
                </span>
              </div>

              {!freeShipping && FREE_SHIPPING_THRESHOLD > 0 && (
                <div className="rounded-lg bg-secondary p-3 text-xs">
                  <p className="flex items-center gap-1.5 font-semibold text-primary">
                    <Tag className="h-3.5 w-3.5" /> Tips hemat ongkir
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Tambah {formatIDR(FREE_SHIPPING_THRESHOLD - subtotal)} lagi untuk gratis ongkir!
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Info voucher aktif dari database */}
              {config && config.vouchers.length > 0 && (
                <div className="rounded-lg border border-dashed border-primary/40 bg-secondary/40 p-3 text-xs">
                  <p className="flex items-center gap-1.5 font-semibold text-primary">
                    <TicketPercent className="h-3.5 w-3.5" /> Voucher tersedia
                  </p>
                  <ul className="mt-1.5 space-y-1 text-muted-foreground">
                    {config.vouchers.slice(0, 3).map((v) => (
                      <li key={v.code} className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-primary">{v.code}</span>
                        <span className="truncate">— {v.description}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">Pakai voucher saat checkout ya!</p>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-lg font-bold text-primary">{formatIDR(subtotal)}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Belum termasuk ongkir — dihitung saat checkout
                </p>
              </div>

              <Button
                size="lg"
                className="w-full gap-2 bg-primary hover:bg-primary/90"
                onClick={() => navigate({ name: 'checkout' })}
              >
                Lanjut ke Checkout <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Dengan melanjutkan, kamu menyetujui{' '}
                <Link href="#" className="underline hover:text-primary">
                  Syarat & Ketentuan
                </Link>{' '}
                BeautyLoka
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
