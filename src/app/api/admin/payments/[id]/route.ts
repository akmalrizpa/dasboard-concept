import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

/** PUT: update metode pembayaran */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await params
    const { code, label, group, desc, fee, isActive, sortOrder } = await req.json()
    if (!code?.trim() || !label?.trim()) {
      return NextResponse.json({ error: 'Kode dan nama metode wajib diisi' }, { status: 400 })
    }
    const method = await db.paymentMethod.update({
      where: { id },
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
    console.error('PUT /api/admin/payments/[id] error', e)
    return NextResponse.json({ error: 'Gagal memperbarui metode pembayaran' }, { status: 500 })
  }
}

/** DELETE: hapus metode pembayaran */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await params
    await db.paymentMethod.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/payments/[id] error', e)
    return NextResponse.json({ error: 'Gagal menghapus metode pembayaran' }, { status: 500 })
  }
}
