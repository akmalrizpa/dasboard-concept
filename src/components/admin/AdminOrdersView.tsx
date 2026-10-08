 
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Eye, Loader2, MapPin, CreditCard, Package } from 'lucide-react'
import { useAdminStore } from '@/store/useAdminStore'
import { useToast } from '@/hooks/use-toast'
import { formatIDR, formatDateID, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/lib/format'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_TABS = [
  { value: 'ALL', label: 'Semua' },
  { value: 'PENDING', label: 'Menunggu Bayar' },
  { value: 'CONFIRMED', label: 'Dibayar' },
  { value: 'PROCESSED', label: 'Dikemas' },
  { value: 'SHIPPED', label: 'Dikirim' },
  { value: 'DELIVERED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
]

const NEXT_STATUS_OPTIONS = [
  'PENDING',
  'CONFIRMED',
  'PROCESSED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

export default function AdminOrdersView() {
  const token = useAdminStore((s) => s.token)
  const { toast } = useToast()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusTab, setStatusTab] = useState('ALL')
  const [search, setSearch] = useState('')
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusTab !== 'ALL') params.set('status', statusTab)
      if (search) params.set('q', search)
      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setOrders(data.orders)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token, statusTab, search])

  useEffect(() => {
    const t = setTimeout(loadOrders, 250)
    return () => clearTimeout(t)
  }, [loadOrders])

  const updateStatus = async (order: Order, newStatus: string) => {
    setUpdatingStatus(order.id)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrders((list) =>
        list.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      )
      if (detailOrder?.id === order.id) {
        setDetailOrder({ ...detailOrder, status: newStatus })
      }
      toast({
        title: 'Status diperbarui ✓',
        description: `${order.orderNumber} → ${ORDER_STATUS_LABELS[newStatus]}`,
      })
    } catch (err) {
      toast({
        title: 'Gagal memperbarui status',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs status */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Filter status pesanan">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={statusTab === tab.value}
            onClick={() => setStatusTab(tab.value)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors',
              statusTab === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-neutral-600 hover:bg-secondary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nomor pesanan / nama / email..."
          className="pl-9"
          aria-label="Cari pesanan"
        />
      </div>

      {/* Tabel */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-900 text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">No. Pesanan</th>
                    <th className="px-4 py-3 font-semibold">Pelanggan</th>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Pembayaran</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-muted-foreground">
                        Tidak ada pesanan ditemukan.
                      </td>
                    </tr>
                  )}
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs font-bold">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.city}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateID(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {order.items.length} produk
                      </td>
                      <td className="px-4 py-3 font-bold">{formatIDR(order.total)}</td>
                      <td className="px-4 py-3 text-xs">
                        {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={order.status}
                          onValueChange={(v) => updateStatus(order, v)}
                          disabled={updatingStatus === order.id}
                        >
                          <SelectTrigger
                            className={cn(
                              'h-8 w-40 border text-[11px] font-bold',
                              ORDER_STATUS_COLORS[order.status]
                            )}
                          >
                            {updatingStatus === order.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {NEXT_STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {ORDER_STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          onClick={() => setDetailOrder(order)}
                          aria-label={`Lihat detail ${order.orderNumber}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog detail pesanan */}
      <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="max-h-90vh overflow-y-auto sm:max-w-lg">
          {detailOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{detailOrder.orderNumber}</DialogTitle>
                <DialogDescription>
                  {formatDateID(detailOrder.createdAt)} • {detailOrder.items.length} produk
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${ORDER_STATUS_COLORS[detailOrder.status]}`}
                  >
                    {ORDER_STATUS_LABELS[detailOrder.status]}
                  </span>
                  <Select
                    value={detailOrder.status}
                    onValueChange={(v) => updateStatus(detailOrder, v)}
                    disabled={updatingStatus === detailOrder.id}
                  >
                    <SelectTrigger className="h-9 w-48 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NEXT_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {ORDER_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-xl border p-4 text-sm">
                  <p className="flex items-center gap-1.5 font-bold">
                    <MapPin className="h-4 w-4 text-primary" /> Alamat Pengiriman
                  </p>
                  <p className="mt-2 font-semibold">{detailOrder.customerName}</p>
                  <p className="text-neutral-600">{detailOrder.phone}</p>
                  <p className="mt-1 text-neutral-600">{detailOrder.address}</p>
                  <p className="text-neutral-600">
                    {detailOrder.city} {detailOrder.postalCode}
                  </p>
                  {detailOrder.notes && (
                    <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
                      Catatan: {detailOrder.notes}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    <Package className="h-4 w-4 text-primary" /> Produk Dipesan
                  </p>
                  {detailOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-neutral-50">
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

                <div className="rounded-xl border p-4 text-sm">
                  <p className="flex items-center gap-1.5 font-bold">
                    <CreditCard className="h-4 w-4 text-primary" /> Pembayaran
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-neutral-600">
                      <span>Metode</span>
                      <span className="font-medium">
                        {PAYMENT_METHOD_LABELS[detailOrder.paymentMethod] || detailOrder.paymentMethod}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal</span>
                      <span>{formatIDR(detailOrder.subtotal)}</span>
                    </div>
                    {detailOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>
                          Diskon{detailOrder.voucherCode ? ` (${detailOrder.voucherCode})` : ''}
                        </span>
                        <span>-{formatIDR(detailOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-600">
                      <span>Pengiriman</span>
                      <span>
                        {detailOrder.shippingCost === 0 ? 'GRATIS' : formatIDR(detailOrder.shippingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatIDR(detailOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
