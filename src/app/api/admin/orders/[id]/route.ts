import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

/** PATCH: update status pesanan */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await context.params
    const { status } = (await req.json()) as { status?: string }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    const order = await db.order.findUnique({ where: { id }, include: { items: true } })
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    // Jika dibatalkan: kembalikan stok produk
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      for (const item of order.items) {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            sold: { decrement: item.quantity },
          },
        }).catch(() => null)
      }
    }

    const updated = await db.order.update({
      where: { id },
      data: { status },
      include: { items: true, customer: true },
    })

    return NextResponse.json({ success: true, order: updated })
  } catch (e) {
    console.error('PATCH /api/admin/orders/[id] error', e)
    return NextResponse.json({ error: 'Gagal memperbarui status pesanan' }, { status: 500 })
  }
}
