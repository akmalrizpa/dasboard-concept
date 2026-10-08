import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'

/** Konfigurasi dinamis untuk halaman checkout: ongkir, pembayaran, voucher aktif, batas gratis ongkir */
export async function GET() {
  try {
    const now = new Date()
    const [shippingMethods, paymentMethods, vouchers, settings] = await Promise.all([
      db.shippingMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      db.paymentMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      db.voucher.findMany({
        where: { isActive: true, startsAt: { lte: now }, expiresAt: { gte: now } },
        orderBy: { createdAt: 'desc' },
      }),
      getSettings(),
    ])

    return NextResponse.json({
      shippingMethods,
      paymentMethods,
      vouchers: vouchers.map((v) => ({
        code: v.code,
        description: v.description,
        type: v.type,
        value: v.value,
        minPurchase: v.minPurchase,
        maxDiscount: v.maxDiscount,
      })),
      freeShippingThreshold: settings['shipping.freeThreshold'] as number,
      codFee: settings['checkout.codFee'] as number,
    })
  } catch (e) {
    console.error('GET /api/checkout/config error', e)
    return NextResponse.json({ error: 'Gagal memuat konfigurasi checkout' }, { status: 500 })
  }
}
