'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Mail, Phone, MapPin, ShoppingBag, Wallet } from 'lucide-react'
import { useAdminStore } from '@/store/useAdminStore'
import { formatIDR, formatDateID } from '@/lib/format'
import type { CustomerSummary } from '@/lib/types'

export default function AdminCustomersView() {
  const token = useAdminStore((s) => s.token)
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/customers', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error('unauthorized')
        return res.json()
      })
      .then((data) => setCustomers(data.customers))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0)
  const avgSpent = customers.length ? totalSpent / customers.length : 0

  return (
    <div className="space-y-4">
      {/* Ringkasan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-xs text-muted-foreground">Total Pelanggan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatIDR(totalSpent)}</p>
              <p className="text-xs text-muted-foreground">Total Belanja Semua Pelanggan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-violet-500/10 p-3">
              <ShoppingBag className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatIDR(Math.round(avgSpent))}</p>
              <p className="text-xs text-muted-foreground">Rata-rata Belanja / Pelanggan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-760 text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Pelanggan</th>
                    <th className="px-4 py-3 font-semibold">Kontak</th>
                    <th className="px-4 py-3 font-semibold">Kota</th>
                    <th className="px-4 py-3 font-semibold">Total Pesanan</th>
                    <th className="px-4 py-3 font-semibold">Total Belanja</th>
                    <th className="px-4 py-3 font-semibold">Bergabung</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-secondary text-xs font-bold text-primary">
                              {c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-semibold">{c.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="flex items-center gap-1.5 text-xs text-neutral-600">
                          <Mail className="h-3 w-3 shrink-0" /> {c.email}
                        </p>
                        {c.phone && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-600">
                            <Phone className="h-3 w-3 shrink-0" /> {c.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {c.city ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {c.city}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold">{c.totalOrders}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-primary">{formatIDR(c.totalSpent)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateID(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
