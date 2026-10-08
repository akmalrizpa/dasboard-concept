import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

const VOUCHER_TYPES = ['PERCENT', 'FIXED', 'FREE_SHIPPING']

/** GET: daftar semua voucher */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const vouchers = await db.voucher.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ vouchers })
  } catch (e) {
    console.error('GET /api/admin/vouchers error', e)
    return NextResponse.json({ error: 'Gagal memuat voucher' }, { status: 500 })
  }
}

/** POST: buat voucher baru */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { code, description, type, value, minPurchase, maxDiscount, usageLimit, startsAt, expiresAt, isActive } =
      await req.json()
    if (!code?.trim()) {
      return NextResponse.json({ error: 'Kode voucher wajib diisi' }, { status: 400 })
    }
    if (!VOUCHER_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Tipe voucher tidak valid' }, { status: 400 })
    }
    if (!expiresAt) {
      return NextResponse.json({ error: 'Tanggal kedaluwarsa wajib diisi' }, { status: 400 })
    }

    const normalized = code.trim().toUpperCase().replace(/\s+/g, '')
    const dupe = await db.voucher.findUnique({ where: { code: normalized } })
    if (dupe) {
      return NextResponse.json({ error: 'Kode voucher sudah digunakan' }, { status: 400 })
    }

    const voucher = await db.voucher.create({
      data: {
        code: normalized,
        description: description?.trim() || '',
        type,
        value: Math.max(0, parseInt(value, 10) || 0),
        minPurchase: Math.max(0, parseInt(minPurchase, 10) || 0),
        maxDiscount: Math.max(0, parseInt(maxDiscount, 10) || 0),
        usageLimit: Math.max(0, parseInt(usageLimit, 10) || 0),
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: new Date(expiresAt),
        isActive: isActive !== false,
      },
    })
    return NextResponse.json({ success: true, voucher })
  } catch (e) {
    console.error('POST /api/admin/vouchers error', e)
    return NextResponse.json({ error: 'Gagal membuat voucher' }, { status: 500 })
  }
}
