 
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Wallet,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useAdminStore } from '@/store/useAdminStore'
import { formatIDR, formatCompactIDR, formatDateID, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/format'
import type { AdminStats } from '@/lib/types'
import { cn } from '@/lib/utils'

const PIE_COLORS = ['#f0197f', '#f97316', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e']

export default function AdminDashboardView() {
  const token = useAdminStore((s) => s.token)
  const navigate = useAppStore((s) => s.navigate)
  const [data, setData] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error('unauthorized')
        return res.json()
      })
      .then(setData)
      .catch((e) => console.error('Gagal memuat statistik', e))
      .finally(() => setLoading(false))
  }, [token])

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const { stats } = data
  const revenueChange = stats.yesterdayRevenue > 0
    ? ((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100
    : stats.todayRevenue > 0 ? 100 : 0
  const orderChange = stats.ordersYesterday > 0
    ? ((stats.ordersToday - stats.ordersYesterday) / stats.ordersYesterday) * 100
    : stats.ordersToday > 0 ? 100 : 0

  const statCards = [
    {
      title: 'Pendapatan Hari Ini',
      value: formatIDR(stats.todayRevenue),
      icon: Wallet,
      change: revenueChange,
      note: `vs kemarin ${formatCompactIDR(stats.yesterdayRevenue)}`,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Pesanan Hari Ini',
      value: String(stats.ordersToday),
      icon: ShoppingCart,
      change: orderChange,
      note: `${stats.pendingOrders} menunggu pembayaran`,
      color: 'bg-amber-500/10 text-amber-600',
    },
    {
      title: 'Total Produk',
      value: String(stats.totalProducts),
      icon: Package,
      change: null,
      note: `${data.lowStockProducts.length} stok menipis`,
      color: 'bg-violet-500/10 text-violet-600',
    },
    {
      title: 'Total Pelanggan',
      value: String(stats.totalCustomers),
      icon: Users,
      change: null,
      note: `${stats.orders30} pesanan / 30 hari`,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
  ]

  const totalStatusCount = data.statusBreakdown.reduce((s, x) => s + x.count, 0)

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={cn('rounded-xl p-2.5', card.color)}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  {card.change !== null && (
                    <span
                      className={cn(
                        'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold',
                        card.change >= 0
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      )}
                    >
                      {card.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(card.change).toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight">{card.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{card.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{card.note}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Area chart: pendapatan */}
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" /> Tren Pendapatan (14 Hari)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.salesChart} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0197f" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f0197f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => formatCompactIDR(v)}
                  />
                  <Tooltip
                    formatter={(value: number | string) => [formatIDR(Number(value)), 'Pendapatan']}
                    labelStyle={{ fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #f3f3f3' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f0197f"
                    strokeWidth={2.5}
                    fill="url(#revGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie: status pesanan */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-primary" /> Status Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {data.statusBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | string, name: string) => [
                      `${value} pesanan`,
                      ORDER_STATUS_LABELS[name] || name,
                    ]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #f3f3f3' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {data.statusBreakdown.map((s, i) => (
                <div key={s.status} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="flex-1 text-muted-foreground">{ORDER_STATUS_LABELS[s.status]}</span>
                  <span className="font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top produk + pesanan terbaru */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top produk */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.topProducts.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada penjualan</p>
            )}
            {data.topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    i === 0
                      ? 'bg-amber-100 text-amber-600'
                      : i === 1
                        ? 'bg-neutral-200 text-neutral-600'
                        : i === 2
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-muted text-muted-foreground'
                  )}
                >
                  {i + 1}
                </span>
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-10 w-10 rounded-lg border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-semibold">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.totalSold} terjual • {formatIDR(p.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bar chart pesanan */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-primary" /> Jumlah Pesanan / Hari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number | string) => [`${value} pesanan`, 'Jumlah']}
                    labelStyle={{ fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #f3f3f3' }}
                  />
                  <Bar dataKey="orders" fill="#f0197f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stok menipis */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Stok Menipis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.lowStockProducts.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Semua stok aman ✓
              </p>
            )}
            {data.lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg border object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-semibold">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">Sisa stok</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-bold',
                    p.stock === 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  )}
                >
                  {p.stock}
                </span>
              </div>
            ))}
            {data.lowStockProducts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1"
                onClick={() => navigate({ name: 'admin-products' })}
              >
                Kelola Stok <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pesanan terbaru */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Pesanan Terbaru</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-primary"
            onClick={() => navigate({ name: 'admin-orders' })}
          >
            Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-640 text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-semibold">No. Pesanan</th>
                  <th className="pb-2 pr-4 font-semibold">Pelanggan</th>
                  <th className="pb-2 pr-4 font-semibold">Tanggal</th>
                  <th className="pb-2 pr-4 font-semibold">Total</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50">
                    <td className="py-3 pr-4 font-mono text-xs font-semibold">{order.orderNumber}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.city}</p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">
                      {formatDateID(order.createdAt)}
                    </td>
                    <td className="py-3 pr-4 font-bold">{formatIDR(order.total)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${ORDER_STATUS_COLORS[order.status]}`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
