'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft,
  CreditCard,
  Wallet,
  Truck,
  Store,
  Loader2,
  TicketPercent,
  X,
  CheckCircle2,
  Tag,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useCartStore } from '@/store/useCartStore'
import { formatIDR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CheckoutConfig, VoucherValidation, VoucherPublic } from '@/lib/types'

const GROUP_ICONS: Record<string, typeof CreditCard> = {
  'Transfer Bank': CreditCard,
  'E-Wallet': Wallet,
  Lainnya: Store,
}

export default function CheckoutView() {
  const navigate = useAppStore((s) => s.navigate)
  const { items, clearCart } = useCartStore()

  const [config, setConfig] = useState<CheckoutConfig | null>(null)
  const [form, setForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  })
  const [shippingMethod, setShippingMethod] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherValidation | null>(null)
  const [voucherError, setVoucherError] = useState('')
  const [voucherChecking, setVoucherChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // ===== Muat konfigurasi dinamis (ongkir, pembayaran, voucher) dari server =====
  useEffect(() => {
    let cancelled = false
    fetch('/api/checkout/config')
      .then(async (res) => {
        if (!res.ok) throw new Error('Gagal memuat konfigurasi')
        return res.json()
      })
      .then((data: CheckoutConfig) => {
        if (cancelled) return
        setConfig(data)
        if (data.shippingMethods.length > 0) setShippingMethod((m) => m || data.shippingMethods[0].code)
        if (data.paymentMethods.length > 0) setPaymentMethod((m) => m || data.paymentMethods[0].code)
      })
      .catch((e) => console.error(e))
    return () => {
      cancelled = true
    }
  }, [])

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const selectedShipping = config?.shippingMethods.find((s) => s.code === shippingMethod)
  const selectedPayment = config?.paymentMethods.find((p) => p.code === paymentMethod)
  const freeThreshold = config?.freeShippingThreshold ?? 0
  const freeShipping = freeThreshold > 0 && subtotal >= freeThreshold
  const voucherFreeShipping = appliedVoucher?.valid && appliedVoucher.freeShipping
  const discount = appliedVoucher?.valid ? appliedVoucher.discount : 0
  const shippingCost = freeShipping || voucherFreeShipping ? 0 : selectedShipping?.cost ?? 0
  const paymentFee = selectedPayment?.fee || 0
  const total = Math.max(0, subtotal - discount) + shippingCost + paymentFee

  // Grup pembayaran berdasarkan kolom `group` di database
  const paymentGroups = useMemo(() => {
    if (!config) return []
    const groups: { label: string; methods: typeof config.paymentMethods }[] = []
    for (const method of config.paymentMethods) {
      const existing = groups.find((g) => g.label === method.group)
      if (existing) existing.methods.push(method)
      else groups.push({ label: method.group, methods: [method] })
    }
    return groups
  }, [config])

  const applyVoucher = async (code?: string) => {
    const toApply = (code ?? voucherCode).trim().toUpperCase()
    if (!toApply) {
      setVoucherError('Masukkan kode voucher dulu')
      return
    }
    setVoucherChecking(true)
    setVoucherError('')
    try {
      const res = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: toApply, subtotal, shippingCost: selectedShipping?.cost ?? 0 }),
      })
      const data = (await res.json()) as VoucherValidation
      if (!res.ok || !data.valid) {
        setAppliedVoucher(null)
        setVoucherError(data.error || 'Voucher tidak valid')
      } else {
        setAppliedVoucher(data)
        setVoucherCode(toApply)
      }
    } catch {
      setVoucherError('Gagal memeriksa voucher. Coba lagi.')
    } finally {
      setVoucherChecking(false)
    }
  }

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
    if (!shippingMethod || !paymentMethod) {
      setError('Pilih metode pengiriman dan pembayaran.')
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
          voucherCode: appliedVoucher?.valid ? appliedVoucher.voucher?.code : undefined,
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

  // Skeleton saat konfigurasi belum termuat
  if (!config) {
    return (
      <main className="container mx-auto px-4 py-6">
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </main>
    )
  }

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

          {/* Pengiriman — metode & tarif dari database */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">3</span>
                Metode Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="grid gap-3 sm:grid-cols-3">
                {config.shippingMethods.map((method) => (
                  <label
                    key={method.code}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all',
                      shippingMethod === method.code ? 'border-primary bg-secondary/50 ring-1 ring-primary' : 'hover:border-neutral-300'
                    )}
                  >
                    <RadioGroupItem value={method.code} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <Truck className="h-4 w-4 text-primary" /> {method.label}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{method.eta}</p>
                      <p className="mt-1 text-sm font-bold">
                        {freeShipping || voucherFreeShipping ? (
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
                  🎉 Selamat! Kamu mendapatkan gratis ongkir karena belanja di atas {formatIDR(freeThreshold)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pembayaran — metode dari database */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">4</span>
                Metode Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentGroups.map((group) => {
                const GroupIcon = GROUP_ICONS[group.label] || Store
                return (
                  <div key={group.label}>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <GroupIcon className="h-3.5 w-3.5" /> {group.label}
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      {group.methods.map((method) => (
                        <label
                          key={method.code}
                          className={cn(
                            'flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 transition-all',
                            paymentMethod === method.code ? 'border-primary bg-secondary/50 ring-1 ring-primary' : 'hover:border-neutral-300'
                          )}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method.code}
                            checked={paymentMethod === method.code}
                            onChange={() => setPaymentMethod(method.code)}
                            className="h-4 w-4 accent-[oklch(0.62_0.23_357)]"
                          />
                          <div>
                            <p className="text-sm font-semibold">{method.label}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {method.desc}
                              {method.fee > 0 && ` (+${formatIDR(method.fee)})`}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Voucher — kode promo dari database */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TicketPercent className="h-4.5 w-4.5 text-primary" />
                Voucher Diskon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {appliedVoucher?.valid ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">
                        {appliedVoucher.voucher?.code} aktif!
                      </p>
                      <p className="text-xs text-emerald-700">
                        {appliedVoucher.freeShipping
                          ? 'Gratis ongkir diterapkan'
                          : `Hemat ${formatIDR(appliedVoucher.discount)}`}
                        {' — '}{appliedVoucher.voucher?.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setAppliedVoucher(null)
                      setVoucherCode('')
                    }}
                    aria-label="Hapus voucher"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={voucherCode}
                      onChange={(e) => {
                        setVoucherCode(e.target.value.toUpperCase())
                        setVoucherError('')
                      }}
                      placeholder="Masukkan kode voucher"
                      className="h-11 pl-9 font-mono uppercase tracking-wide"
                      aria-label="Kode voucher"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => applyVoucher()}
                    disabled={voucherChecking || !voucherCode.trim()}
                    className="h-11 gap-1.5"
                  >
                    {voucherChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <TicketPercent className="h-4 w-4" />}
                    Pakai
                  </Button>
                </div>
              )}
              {voucherError && (
                <p className="text-xs font-semibold text-rose-600" role="alert">
                  {voucherError}
                </p>
              )}

              {/* Daftar voucher aktif (dari database) */}
              {config.vouchers.length > 0 && !appliedVoucher?.valid && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Voucher tersedia:</p>
                  <div className="flex flex-wrap gap-2">
                    {config.vouchers.map((v: VoucherPublic) => (
                      <button
                        key={v.code}
                        type="button"
                        onClick={() => {
                          setVoucherCode(v.code)
                          applyVoucher(v.code)
                        }}
                        disabled={voucherChecking || subtotal < v.minPurchase}
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-secondary/50 px-3 py-1.5 text-left text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
                        )}
                        title={subtotal < v.minPurchase ? `Min. belanja ${formatIDR(v.minPurchase)}` : v.description}
                      >
                        <TicketPercent className="h-3.5 w-3.5" />
                        {v.code}
                        <span className="font-normal opacity-80">
                          {v.type === 'PERCENT' && `${v.value}%${v.maxDiscount > 0 ? ` max ${formatIDR(v.maxDiscount)}` : ''}`}
                          {v.type === 'FIXED' && formatIDR(v.value)}
                          {v.type === 'FREE_SHIPPING' && 'Gratis Ongkir'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="flex items-center gap-1">
                      <TicketPercent className="h-3.5 w-3.5" /> Voucher {appliedVoucher?.voucher?.code}
                    </span>
                    <span className="font-semibold">-{formatIDR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pengiriman ({selectedShipping?.label})</span>
                  <span className={cn('font-semibold', (freeShipping || voucherFreeShipping) && 'text-emerald-600')}>
                    {freeShipping || voucherFreeShipping ? 'GRATIS' : formatIDR(shippingCost)}
                  </span>
                </div>
                {paymentFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biaya {selectedPayment?.label}</span>
                    <span className="font-semibold">{formatIDR(paymentFee)}</span>
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
