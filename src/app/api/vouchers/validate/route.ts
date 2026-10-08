import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** Validasi kode voucher & hitung preview diskon.
 *  Body: { code, subtotal, shippingCost } → { valid, discount, freeShipping, voucher, error }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { code?: string; subtotal?: number; shippingCost?: number }
    const code = (body.code || '').trim().toUpperCase()
    const subtotal = Math.max(0, Number(body.subtotal) || 0)
    const shippingCost = Math.max(0, Number(body.shippingCost) || 0)

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Kode voucher kosong' }, { status: 400 })
    }

    const now = new Date()
    const voucher = await db.voucher.findUnique({ where: { code } })

    if (!voucher || !voucher.isActive) {
      return NextResponse.json({ valid: false, error: 'Kode voucher tidak ditemukan' }, { status: 404 })
    }
    if (voucher.startsAt > now) {
      return NextResponse.json({ valid: false, error: 'Voucher belum berlaku' }, { status: 400 })
    }
    if (voucher.expiresAt < now) {
      return NextResponse.json({ valid: false, error: 'Voucher sudah kedaluwarsa' }, { status: 400 })
    }
    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
      return NextResponse.json({ valid: false, error: 'Kuota voucher sudah habis' }, { status: 400 })
    }
    if (subtotal < voucher.minPurchase) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimal belanja Rp${voucher.minPurchase.toLocaleString('id-ID')} untuk voucher ini`,
        },
        { status: 400 }
      )
    }

    let discount = 0
    let freeShipping = false
    if (voucher.type === 'PERCENT') {
      discount = Math.floor((subtotal * voucher.value) / 100)
      if (voucher.maxDiscount > 0) discount = Math.min(discount, voucher.maxDiscount)
    } else if (voucher.type === 'FIXED') {
      discount = Math.min(voucher.value, subtotal)
    } else if (voucher.type === 'FREE_SHIPPING') {
      freeShipping = true
    }

    return NextResponse.json({
      valid: true,
      discount,
      freeShipping,
      voucher: {
        code: voucher.code,
        description: voucher.description,
        type: voucher.type,
        value: voucher.value,
        minPurchase: voucher.minPurchase,
        maxDiscount: voucher.maxDiscount,
      },
    })
  } catch (e) {
    console.error('POST /api/vouchers/validate error', e)
    return NextResponse.json({ valid: false, error: 'Gagal memvalidasi voucher' }, { status: 500 })
  }
}
