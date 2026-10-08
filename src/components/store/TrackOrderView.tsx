 
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Package, Search, Loader2, MapPin, Clock } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatIDR, formatDateID, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/lib/format'
import type { Order } from '@/lib/types'

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSED', 'SHIPPED', 'DELIVERED']

export default function TrackOrderView() {
  const navigate = useAppStore((s) => s.navigate)
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<Order | null>(null)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setOrder(null)
    if (!orderNumber.trim() || !email.trim()) {
      setError('Nomor pesanan dan email wajib diisi.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Pesanan tidak ditemukan')
      setOrder(data.order)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal melacak pesanan')
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1
  const cancelled = order?.status === 'CANCELLED'

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8 animate-fade-in-up">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <Package className="h-8 w-8 text-primary" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-bold md:text-3xl">Lacak Pesanan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Masukkan nomor pesanan dan email yang kamu gunakan saat checkout.
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <form onSubmit={handleTrack} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="trackNumber">Nomor Pesanan</Label>
              <Input
                id="trackNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="BL-20261008-1234"
                className="h-11 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trackEmail">Email</Label>
              <Input
                id="trackEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="h-11"
              />
            </div>
            <Button type="submit" size="lg" className="gap-2 bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Lacak
            </Button>
          </form>
          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {order && (
        <Card className="mt-6 animate-fade-in-up">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-mono">{order.orderNumber}</CardTitle>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${ORDER_STATUS_COLORS[order.status]}`}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Dibuat {formatDateID(order.createdAt)}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress */}
            {cancelled ? (
              <div className="rounded-xl bg-rose-50 p-4 text-center text-sm font-semibold text-rose-700">
                Pesanan ini telah dibatalkan. Hubungi CS kami bila ada pertanyaan.
              </div>
            ) : (
              <div aria-label="Status pengiriman">
                <div className="flex items-center">
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} className="flex flex-1 items-center last:flex-none">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                          i <= stepIndex
                            ? 'border-primary bg-primary text-white'
                            : 'border-neutral-200 bg-white text-neutral-400'
                        }`}
                      >
                        {i + 1}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 ${i < stepIndex ? 'bg-primary' : 'bg-neutral-200'}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-medium text-muted-foreground sm:text-xs">
                  {STATUS_STEPS.map((step) => (
                    <span key={step} className="w-14 text-center leading-tight sm:w-20">
                      {ORDER_STATUS_LABELS[step]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Item */}
            <div>
              <p className="mb-3 text-sm font-bold">Produk Dipesan</p>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-50">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {formatIDR(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-bold">{formatIDR(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Info & total */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold">
                  <MapPin className="h-4 w-4 text-primary" /> Alamat Tujuan
                </p>
                <p className="mt-2 text-sm font-semibold">{order.customerName}</p>
                <p className="text-sm text-neutral-600">{order.address}</p>
                <p className="text-sm text-neutral-600">
                  {order.city} {order.postalCode}
                </p>
                <p className="mt-1 text-sm text-neutral-600">{order.phone}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold">
                  <Clock className="h-4 w-4 text-primary" /> Rincian Pembayaran
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span> <span>{formatIDR(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Pengiriman</span>
                    <span>{order.shippingCost === 0 ? 'GRATIS' : formatIDR(order.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Metode</span>
                    <span>{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-bold">
                    <span>Total</span> <span className="text-primary">{formatIDR(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 text-center">
        <Badge variant="outline" className="gap-1.5 border-primary/30 px-4 py-1.5 text-xs text-primary">
          💡 Contoh: BL-20261025-1000 dengan email dewi.lestari@gmail.com
        </Badge>
        <div className="mt-4">
          <Button variant="ghost" onClick={() => navigate({ name: 'home' })} className="text-primary">
            ← Kembali ke Beranda
          </Button>
        </div>
      </div>
    </main>
  )
}
