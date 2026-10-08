import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

/** PUT: update metode pengiriman */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await params
    const { code, label, eta, cost, isActive, sortOrder } = await req.json()
    if (!code?.trim() || !label?.trim()) {
      return NextResponse.json({ error: 'Kode dan nama metode wajib diisi' }, { status: 400 })
    }
    const method = await db.shippingMethod.update({
      where: { id },
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
    console.error('PUT /api/admin/shipping/[id] error', e)
    return NextResponse.json({ error: 'Gagal memperbarui metode pengiriman' }, { status: 500 })
  }
}

/** DELETE: hapus metode pengiriman */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await params
    await db.shippingMethod.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/shipping/[id] error', e)
    return NextResponse.json({ error: 'Gagal menghapus metode pengiriman' }, { status: 500 })
  }
}
