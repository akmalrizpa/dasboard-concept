 
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, CreditCard, Wallet, Truck, Store, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useCartStore } from '@/store/useCartStore'
import { formatIDR } from '@/lib/format'
import { cn } from '@/lib/utils'

const FREE_SHIPPING_THRESHOLD = 300000

const SHIPPING_METHODS = [
  { id: 'REGULER', label: 'Reguler', eta: '2-4 hari kerja', cost: 15000 },
  { id: 'KARGO', label: 'Kargo Hemat', eta: '4-7 hari kerja', cost: 9000 },
  { id: 'INSTAN', label: 'Instan', eta: 'Hari ini', cost: 25000 },
]

const PAYMENT_GROUPS = [
  {
    label: 'Transfer Bank',
    icon: CreditCard,
    methods: [
      { id: 'BCA', label: 'BCA', desc: 'Virtual Account otomatis' },
      { id: 'MANDIRI', label: 'Mandiri', desc: 'Virtual Account otomatis' },
      { id: 'BNI', label: 'BNI', desc: 'Virtual Account otomatis' },
    ],
  },
  {
    label: 'E-Wallet',
    icon: Wallet,
    methods: [
      { id: 'GOPAY', label: 'GoPay', desc: 'Bayar dengan saldo Gojek' },
      { id: 'OVO', label: 'OVO', desc: 'Bayar dengan saldo OVO' },
      { id: 'DANA', label: 'DANA', desc: 'Bayar dengan saldo DANA' },
    ],
  },
  {
    label: 'Lainnya',
    icon: Store,
    methods: [
      { id: 'QRIS', label: 'QRIS', desc: 'Scan QR semua aplikasi' },
      { id: 'COD', label: 'COD', desc: 'Bayar saat paket tiba (+Rp2.500)' },
    ],
  },
]

export default function CheckoutView() {
  const navigate = useAppStore((s) => s.navigate)
  const { items, clearCart } = useCartStore()

  const [form, setForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  })
  const [shippingMethod, setShippingMethod] = useState('REGULER')
  const [paymentMethod, setPaymentMethod] = useState('BCA')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const selectedShipping = SHIPPING_METHODS.find((s) => s.id === shippingMethod)!
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
  const codFee = paymentMethod === 'COD' ? 2500 : 0
  const shippingCost = freeShipping ? 0 : selectedShipping.cost
  const total = subtotal + shippingCost + codFee

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!items.length) {
      setError('Keranjang kosong.')
      return
    }
    if (!form.customerName.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Nama, email, dan nomor HP wajib diisi.')
      return
    }
    if (!form.address.trim() || !form.city.trim() || !form.postalCode.trim()) {
      setError('Alamat, kota, dan kode pos wajib diisi.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          shippingMethod,
          paymentMethod,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Checkout gagal')
      }
      clearCart()
      navigate({
        name: 'success',
        orderNumber: data.orderNumber,
        total: data.total,
        paymentMethod: data.paymentMethod,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0 && !submitting) {
    return (
      <main className="container mx-auto px-4 py-20 text-center">
        <p className="text-5xl" aria-hidden>🛒</p>
        <h1 className="mt-4 text-2xl font-bold">Tidak ada yang bisa di-checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">Keranjang belanjamu kosong.</p>
        <Button
          onClick={() => navigate({ name: 'products', title: 'Semua Produk' })}
          className="mt-6 rounded-full bg-primary hover:bg-primary/90 px-8"
        >
          Mulai Belanja
        </Button>
      </main>
    )
  }

  const inputCls = 'h-11'

  return (
    <main className="container mx-auto px-4 py-6 animate-fade-in-up">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate({ name: 'cart' })} aria-label="Kembali ke keranjang">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold md:text-3xl">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Data kontak */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span>
                Informasi Kontak
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Nama Lengkap *</Label>
                <Input id="customerName" value={form.customerName} onChange={set('customerName')} placeholder="Contoh: Putri Ayu" className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="nama@email.com" className={inputCls} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="phone">Nomor HP / WhatsApp *</Label>
                <Input id="phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="08xx-xxxx-xxxx" className={inputCls} required />
              </div>
            </CardContent>
          </Card>

          {/* Alamat */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">2</span>
                Alamat Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Alamat Lengkap *</Label>
                <Textarea id="address" value={form.address} onChange={set('address')} placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan" rows={2} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Kota / Kabupaten *</Label>
                <Input id="city" value={form.city} onChange={set('city')} placeholder="Contoh: Jakarta Selatan" className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postalCode">Kode Pos *</Label>
                <Input id="postalCode" value={form.postalCode} onChange={set('postalCode')} placeholder="12345" className={inputCls} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes">Catatan untuk Kurir (opsional)</Label>
                <Input id="notes" value={form.notes} onChange={set('notes')} placeholder="Contoh: Titip ke satpam jika tidak ada di rumah" className={inputCls} />
              </div>
            </CardContent>
          </Card>

          {/* Pengiriman */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">3</span>
                Metode Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="grid gap-3 sm:grid-cols-3">
                {SHIPPING_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all',
                      shippingMethod === method.id ? 'border-primary bg-secondary/50 ring-1 ring-primary' : 'hover:border-neutral-300'
                    )}
                  >
                    <RadioGroupItem value={method.id} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <Truck className="h-4 w-4 text-primary" /> {method.label}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{method.eta}</p>
                      <p className="mt-1 text-sm font-bold">
                        {freeShipping ? (
                          <span className="text-emerald-600">GRATIS</span>
                        ) : (
                          formatIDR(method.cost)
                        )}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
              {freeShipping && (
                <p className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700">
                  🎉 Selamat! Kamu mendapatkan gratis ongkir karena belanja di atas {formatIDR(FREE_SHIPPING_THRESHOLD)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pembayaran */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">4</span>
                Metode Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {PAYMENT_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {group.methods.map((method) => (
                      <label
                        key={method.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 transition-all',
                          paymentMethod === method.id ? 'border-primary bg-secondary/50 ring-1 ring-primary' : 'hover:border-neutral-300'
                        )}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                          className="h-4 w-4 accent-[oklch(0.62_0.23_357)]"
                        />
                        <div>
                          <p className="text-sm font-semibold">{method.label}</p>
                          <p className="text-[11px] text-muted-foreground">{method.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Ringkasan pesanan */}
        <div className="lg:sticky lg:top-40 lg:self-start">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-56 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-50">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <p className="line-clamp-2 flex-1 text-xs font-medium">{item.name}</p>
                    <p className="text-xs font-bold">{formatIDR(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pengiriman ({selectedShipping.label})</span>
                  <span className={cn('font-semibold', freeShipping && 'text-emerald-600')}>
                    {freeShipping ? 'GRATIS' : formatIDR(shippingCost)}
                  </span>
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biaya COD</span>
                    <span className="font-semibold">{formatIDR(codFee)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="font-bold">Total Pembayaran</span>
                  <span className="text-lg font-bold text-primary">{formatIDR(total)}</span>
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="mt-4 w-full gap-2 bg-primary hover:bg-primary/90" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Memproses Pesanan...
                  </>
                ) : (
                  <>Buat Pesanan • {formatIDR(total)}</>
                )}
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Pesanan dibuat tidak berarti terbayar. Selesaikan pembayaran sesuai instruksi.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </main>
  )
}
