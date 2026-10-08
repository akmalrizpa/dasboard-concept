import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

const VOUCHER_TYPES = ['PERCENT', 'FIXED', 'FREE_SHIPPING']

/** PUT: update voucher */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await params
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
    const dupe = await db.voucher.findFirst({ where: { code: normalized, NOT: { id } } })
    if (dupe) {
      return NextResponse.json({ error: 'Kode voucher sudah digunakan' }, { status: 400 })
    }

    const voucher = await db.voucher.update({
      where: { id },
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
    console.error('PUT /api/admin/vouchers/[id] error', e)
    return NextResponse.json({ error: 'Gagal memperbarui voucher' }, { status: 500 })
  }
}

/** DELETE: hapus voucher */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await params
    await db.voucher.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/vouchers/[id] error', e)
    return NextResponse.json({ error: 'Gagal menghapus voucher' }, { status: 500 })
  }
}
