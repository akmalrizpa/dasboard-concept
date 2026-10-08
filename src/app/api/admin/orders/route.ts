import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

/** GET: daftar pesanan + filter status & pencarian */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const q = searchParams.get('q')

    const orders = await db.order.findMany({
      where: {
        ...(status && status !== 'ALL' ? { status } : {}),
        ...(q
          ? {
              OR: [
                { orderNumber: { contains: q.toUpperCase() } },
                { customerName: { contains: q } },
                { email: { contains: q } },
              ],
            }
          : {}),
      },
      include: { items: true, customer: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (e) {
    console.error('GET /api/admin/orders error', e)
    return NextResponse.json({ error: 'Gagal memuat pesanan' }, { status: 500 })
  }
}
