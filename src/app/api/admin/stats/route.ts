import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

/** Statistik dashboard admin: revenue, orders, grafik penjualan, top produk, status pesanan */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }

  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const daysAgo = (n: number) => {
      const d = new Date(startOfToday)
      d.setDate(d.getDate() - n)
      return d
    }
    const start14 = daysAgo(13)
    const start30 = daysAgo(29)
    const startYesterday = daysAgo(1)

    const [
      totalOrders,
      pendingOrders,
      totalProducts,
      totalCustomers,
      orders30,
      ordersToday,
      ordersYesterday,
      revenueAgg,
      salesByDay,
      statusGroups,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: 'PENDING' } }),
      db.product.count(),
      db.customer.count(),
      db.order.count({ where: { createdAt: { gte: start30 }, status: { not: 'CANCELLED' } } }),
      db.order.count({ where: { createdAt: { gte: startOfToday } } }),
      db.order.count({ where: { createdAt: { gte: startYesterday, lt: startOfToday } } }),
      db.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      db.order.findMany({
        where: { createdAt: { gte: start14 }, status: { not: 'CANCELLED' } },
        select: { createdAt: true, total: true },
      }),
      db.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      db.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      db.product.findMany({
        where: { stock: { lte: 10 }, isActive: true },
        orderBy: { stock: 'asc' },
        take: 5,
        select: { id: true, name: true, stock: true, image: true },
      }),
    ])

    // Top produk via aggregation manual (groupBy dengan _sum quantity)
    const topProductItems = await db.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    })
    const topProductDetails = await db.product.findMany({
      where: { id: { in: topProductItems.map((t) => t.productId) } },
      select: { id: true, name: true, image: true, price: true },
    })
    const topProductsFinal = topProductItems.map((t) => {
      const p = topProductDetails.find((d) => d.id === t.productId)
      return {
        productId: t.productId,
        name: p?.name || 'Produk',
        image: p?.image || '',
        price: p?.price || 0,
        totalSold: t._sum.quantity || 0,
        revenue: (t._sum.quantity || 0) * (p?.price || 0),
      }
    })

    // Grafik penjualan 14 hari
    const salesChart: { date: string; label: string; orders: number; revenue: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const dayStart = daysAgo(i)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)
      const inRange = salesByDay.filter((o) => o.createdAt >= dayStart && o.createdAt < dayEnd)
      salesChart.push({
        date: dayStart.toISOString().slice(0, 10),
        label: dayStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        orders: inRange.length,
        revenue: inRange.reduce((s, o) => s + o.total, 0),
      })
    }

    const todayRevenueAgg = await db.order.aggregate({
      where: { createdAt: { gte: startOfToday }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    })
    const yesterdayRevenueAgg = await db.order.aggregate({
      where: {
        createdAt: { gte: startYesterday, lt: startOfToday },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
    })

    return NextResponse.json({
      stats: {
        totalRevenue: revenueAgg._sum.total || 0,
        todayRevenue: todayRevenueAgg._sum.total || 0,
        yesterdayRevenue: yesterdayRevenueAgg._sum.total || 0,
        totalOrders,
        ordersToday,
        ordersYesterday,
        orders30,
        pendingOrders,
        totalProducts,
        totalCustomers,
      },
      salesChart,
      statusBreakdown: statusGroups.map((g) => ({ status: g.status, count: g._count.status })),
      topProducts: topProductsFinal,
      recentOrders,
      lowStockProducts,
    })
  } catch (e) {
    console.error('GET /api/admin/stats error', e)
    return NextResponse.json({ error: 'Gagal memuat statistik' }, { status: 500 })
  }
}
