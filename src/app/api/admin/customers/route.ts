import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

/** GET: daftar pelanggan dengan agregat pesanan */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const customers = await db.customer.findMany({
      include: {
        orders: {
          where: { status: { not: 'CANCELLED' } },
          select: { total: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      createdAt: c.createdAt,
      totalOrders: c.orders.length,
      totalSpent: c.orders.reduce((s, o) => s + o.total, 0),
    }))

    return NextResponse.json({ customers: result })
  } catch (e) {
    console.error('GET /api/admin/customers error', e)
    return NextResponse.json({ error: 'Gagal memuat pelanggan' }, { status: 500 })
  }
}
