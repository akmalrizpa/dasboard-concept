/** Format angka ke Rupiah: 150000 -> "Rp150.000" */
export function formatIDR(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format angka ringkas: 12500 -> "12,5 rb", 3200000 -> "3,2 jt" */
export function formatCompactIDR(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} rb`
  }
  return value.toLocaleString('id-ID')
}

/** Format tanggal Indonesia: "9 Okt 2026, 14.30" */
export function formatDateID(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Hitung persentase diskon */
export function discountPercent(price: number, originalPrice?: number | null): number {
  if (!originalPrice || originalPrice <= price) return 0
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

/** Label status pesanan (Bahasa Indonesia) */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu Pembayaran',
  CONFIRMED: 'Pembayaran Diterima',
  PROCESSED: 'Sedang Dikemas',
  SHIPPED: 'Sedang Dikirim',
  DELIVERED: 'Pesanan Selesai',
  CANCELLED: 'Dibatalkan',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-sky-100 text-sky-700 border-sky-200',
  PROCESSED: 'bg-violet-100 text-violet-700 border-violet-200',
  SHIPPED: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  DELIVERED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BCA: 'Transfer Bank BCA',
  MANDIRI: 'Transfer Bank Mandiri',
  BNI: 'Transfer Bank BNI',
  GOPAY: 'GoPay',
  OVO: 'OVO',
  DANA: 'DANA',
  QRIS: 'QRIS',
  COD: 'COD (Bayar di Tempat)',
}

/** Opsi pengiriman */
export const SHIPPING_OPTIONS = [
  {
    id: 'REGULER',
    label: 'Reguler',
    eta: '2-4 hari',
    cost: 15000,
    freeThreshold: 300000,
  },
  {
    id: 'KARGO',
    label: 'Kargo Hemat',
    eta: '4-7 hari',
    cost: 9000,
    freeThreshold: 300000,
  },
  {
    id: 'INSTAN',
    label: 'Instan (Same Day)',
    eta: 'hari ini',
    cost: 25000,
    freeThreshold: 500000,
  },
] as const

export type ShippingOptionId = (typeof SHIPPING_OPTIONS)[number]['id']

/** Generate nomor pesanan: BL-20261009-XXXX */
export function generateOrderNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `BL-${y}${m}${d}-${rand}`
}

/** Slugify nama produk ke URL-friendly slug */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
