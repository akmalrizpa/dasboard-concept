import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** Lacak pesanan berdasarkan nomor pesanan + email */
export async function POST(req: NextRequest) {
  try {
    const { orderNumber, email } = (await req.json()) as { orderNumber?: string; email?: string }
    if (!orderNumber?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Nomor pesanan dan email wajib diisi' }, { status: 400 })
    }

    const order = await db.order.findFirst({
      where: {
        orderNumber: orderNumber.trim().toUpperCase(),
        email: email.toLowerCase().trim(),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan. Periksa kembali nomor pesanan dan email Anda.' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (e) {
    console.error('POST /api/orders/track error', e)
    return NextResponse.json({ error: 'Gagal melacak pesanan' }, { status: 500 })
  }
}
