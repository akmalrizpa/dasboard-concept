import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

/** GET: daftar metode pembayaran */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const methods = await db.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json({ methods })
  } catch (e) {
    console.error('GET /api/admin/payments error', e)
    return NextResponse.json({ error: 'Gagal memuat metode pembayaran' }, { status: 500 })
  }
}

/** POST: buat metode pembayaran */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { code, label, group, desc, fee, isActive, sortOrder } = await req.json()
    if (!code?.trim() || !label?.trim()) {
      return NextResponse.json({ error: 'Kode dan nama metode wajib diisi' }, { status: 400 })
    }
    const dupe = await db.paymentMethod.findUnique({ where: { code: code.trim().toUpperCase() } })
    if (dupe) {
      return NextResponse.json({ error: 'Kode sudah digunakan' }, { status: 400 })
    }
    const method = await db.paymentMethod.create({
      data: {
        code: code.trim().toUpperCase(),
        label: label.trim(),
        group: group?.trim() || 'Lainnya',
        desc: desc?.trim() || '',
        fee: Math.max(0, parseInt(fee, 10) || 0),
        isActive: isActive !== false,
        sortOrder: parseInt(sortOrder, 10) || 0,
      },
    })
    return NextResponse.json({ success: true, method })
  } catch (e) {
    console.error('POST /api/admin/payments error', e)
    return NextResponse.json({ error: 'Gagal membuat metode pembayaran' }, { status: 500 })
  }
}
