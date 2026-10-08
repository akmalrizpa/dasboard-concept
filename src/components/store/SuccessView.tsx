'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Copy, ShoppingBag, Package, CreditCard, Banknote, QrCode, Truck } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatIDR, PAYMENT_METHOD_LABELS } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'

export default function SuccessView({
  orderNumber,
  total,
  paymentMethod,
}: {
  orderNumber: string
  total: number
  paymentMethod: string
}) {
  const navigate = useAppStore((s) => s.navigate)
  const { toast } = useToast()
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 2500)
    return () => clearTimeout(t)
  }, [])

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber).then(() => {
      toast({ title: 'Disalin!', description: `Nomor pesanan ${orderNumber} tersalin ke clipboard` })
    }).catch(() => {})
  }

  const isVA = ['BCA', 'MANDIRI', 'BNI'].includes(paymentMethod)
  const isEWallet = ['GOPAY', 'OVO', 'DANA'].includes(paymentMethod)
  const isQRIS = paymentMethod === 'QRIS'
  const isCOD = paymentMethod === 'COD'

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12 text-center animate-fade-in-up">
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-xl"
              style={{
                left: `${(i * 37) % 100}%`,
                top: '-5%',
                animation: `fade-in-up 0.5s ease-out ${i * 0.05}s both`,
                transform: `rotate(${i * 36}deg)`,
              }}
            >
              {['🎉', '✨', '💄', '🌸', '💖'][i % 5]}
            </span>
          ))}
        </div>
      )}

      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-11 w-11 text-emerald-600" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-bold md:text-3xl">Pesanan Berhasil Dibuat! 🎊</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Terima kasih sudah berbelanja di BeautyLoka. Pesananmu sedang menunggu pembayaran.
        Kami akan mengirim detail pesanan ke email kamu.
      </p>

      <Card className="mt-8 text-left">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between rounded-xl bg-secondary/70 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Nomor Pesanan</p>
              <p className="text-lg font-bold tracking-wide">{orderNumber}</p>
            </div>
            <Button variant="outline" size="icon" onClick={copyOrderNumber} aria-label="Salin nomor pesanan">
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border p-3">
              <CreditCard className="h-8 w-8 text-primary" aria-hidden />
              <div>
                <p className="text-xs text-muted-foreground">Metode Pembayaran</p>
                <p className="text-sm font-semibold">
                  {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border p-3">
              <Banknote className="h-8 w-8 text-primary" aria-hidden />
              <div>
                <p className="text-xs text-muted-foreground">Total Pembayaran</p>
                <p className="text-sm font-bold text-primary">{formatIDR(total)}</p>
              </div>
            </div>
          </div>

          {/* Instruksi pembayaran */}
          <div className="rounded-xl border border-dashed p-4">
            <p className="flex items-center gap-2 text-sm font-bold">
              <QrCode className="h-4 w-4 text-primary" /> Instruksi Pembayaran
            </p>
            {isVA && (
              <div className="mt-2 space-y-1 text-sm text-neutral-600">
                <p>
                  1. Transfer <strong>{formatIDR(total)}</strong> ke Virtual Account{' '}
                  <strong>{paymentMethod} 8808 1234 5678</strong> (a/n BeautyLoka)
                </p>
                <p>2. Pembayaran diverifikasi otomatis dalam 5 menit setelah transfer</p>
                <p>3. Status pesanan akan berubah menjadi &quot;Pembayaran Diterima&quot;</p>
              </div>
            )}
            {isEWallet && (
              <div className="mt-2 space-y-1 text-sm text-neutral-600">
                <p>1. Buka aplikasi {paymentMethod} di HP kamu</p>
                <p>2. Scan QR atau approve push notification pembayaran sebesar {formatIDR(total)}</p>
                <p>3. Pesanan otomatis terkonfirmasi setelah pembayaran berhasil</p>
              </div>
            )}
            {isQRIS && (
              <div className="mt-2 space-y-1 text-sm text-neutral-600">
                <p>1. Buka aplikasi e-wallet atau mobile banking apa pun</p>
                <p>2. Scan QRIS di halaman pembayaran dan bayar {formatIDR(total)}</p>
                <p>3. Konfirmasi otomatis dalam 1x24 jam</p>
              </div>
            )}
            {isCOD && (
              <div className="mt-2 space-y-1 text-sm text-neutral-600">
                <p>1. Siapkan uang tunai sebesar <strong>{formatIDR(total)}</strong> saat kurir tiba</p>
                <p>2. Periksa paket sebelum membayar</p>
                <p>3. Simpan struk pembayaran dari kurir sebagai bukti</p>
              </div>
            )}
            <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
              ⏰ Selesaikan pembayaran dalam <strong>24 jam</strong> agar pesanan tidak dibatalkan otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4 shrink-0" />
            <p>Estimasi paket tiba 2-4 hari kerja setelah pembayaran terverifikasi.</p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          size="lg"
          className="gap-2 rounded-full bg-primary px-8 hover:bg-primary/90"
          onClick={() => navigate({ name: 'home' })}
        >
          <ShoppingBag className="h-4 w-4" /> Belanja Lagi
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="gap-2 rounded-full px-8"
          onClick={() => navigate({ name: 'track' })}
        >
          <Package className="h-4 w-4" /> Lacak Pesanan
        </Button>
      </div>
    </main>
  )
}
