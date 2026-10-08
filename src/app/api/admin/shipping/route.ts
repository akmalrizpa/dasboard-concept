import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

/** GET: daftar metode pengiriman */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const methods = await db.shippingMethod.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json({ methods })
  } catch (e) {
    console.error('GET /api/admin/shipping error', e)
    return NextResponse.json({ error: 'Gagal memuat metode pengiriman' }, { status: 500 })
  }
}

/** POST: buat metode pengiriman */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { code, label, eta, cost, isActive, sortOrder } = await req.json()
    if (!code?.trim() || !label?.trim()) {
      return NextResponse.json({ error: 'Kode dan nama metode wajib diisi' }, { status: 400 })
    }
    const dupe = await db.shippingMethod.findUnique({ where: { code: code.trim().toUpperCase() } })
    if (dupe) {
      return NextResponse.json({ error: 'Kode sudah digunakan' }, { status: 400 })
    }
    const method = await db.shippingMethod.create({
      data: {
        code: code.trim().toUpperCase(),
        label: label.trim(),
        eta: eta?.trim() || '',
        cost: Math.max(0, parseInt(cost, 10) || 0),
        isActive: isActive !== false,
        sortOrder: parseInt(sortOrder, 10) || 0,
      },
    })
    return NextResponse.json({ success: true, method })
  } catch (e) {
    console.error('POST /api/admin/shipping error', e)
    return NextResponse.json({ error: 'Gagal membuat metode pengiriman' }, { status: 500 })
  }
}
