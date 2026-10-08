'use client'

import { useEffect } from 'react'
import { useAppStore, View } from '@/store/useAppStore'
import { useAdminStore } from '@/store/useAdminStore'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import AdminLoginView from './AdminLoginView'
import AdminDashboardView from './AdminDashboardView'
import AdminProductsView from './AdminProductsView'
import AdminOrdersView from './AdminOrdersView'
import AdminCustomersView from './AdminCustomersView'
import AdminCategoriesView from './AdminCategoriesView'
import AdminVouchersView from './AdminVouchersView'
import AdminSettingsView from './AdminSettingsView'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  TicketPercent,
  Settings,
  Store,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MENU: { view: View['name']; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'admin-dashboard', label: 'Dasbor', icon: LayoutDashboard },
  { view: 'admin-products', label: 'Produk', icon: Package },
  { view: 'admin-orders', label: 'Pesanan', icon: ShoppingCart },
  { view: 'admin-customers', label: 'Pelanggan', icon: Users },
  { view: 'admin-categories', label: 'Kategori & Brand', icon: FolderTree },
  { view: 'admin-vouchers', label: 'Voucher & Promo', icon: TicketPercent },
  { view: 'admin-settings', label: 'Pengaturan', icon: Settings },
]

export default function AdminShell() {
  const view = useAppStore((s) => s.view)
  const navigate = useAppStore((s) => s.navigate)
  const { token, adminName, adminUsername, logout } = useAdminStore()

  // Jika belum login, tampilkan halaman login
  useEffect(() => {
    if (!token && view.name.startsWith('admin-') && view.name !== 'admin-login') {
      navigate({ name: 'admin-login' })
    }
  }, [token, view.name, navigate])

  if (!token) {
    return <AdminLoginView />
  }

  const currentView = view.name
  const activeMenu = MENU.find((m) => m.view === currentView)

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-white lg:flex" aria-label="Menu admin">
        <div className="flex items-center gap-2 border-b px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">BeautyLoka</p>
            <p className="text-[11px] text-muted-foreground">Panel Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {MENU.map((item) => {
            const Icon = item.icon
            const active = currentView === item.view
            return (
              <button
                key={item.view}
                onClick={() => navigate({ name: item.view } as View)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-neutral-600 hover:bg-secondary hover:text-primary'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="border-t p-3">
          <button
            onClick={() => navigate({ name: 'home' })}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-secondary hover:text-primary"
          >
            <Store className="h-4.5 w-4.5" /> Lihat Toko
          </button>
          <button
            onClick={() => {
              logout()
              navigate({ name: 'home' })
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
          >
            <LogOut className="h-4.5 w-4.5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Konten utama */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-white px-4 py-3 lg:px-6">
          {/* Mobile nav */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar lg:hidden" aria-label="Menu admin mobile">
            {MENU.map((item) => {
              const Icon = item.icon
              const active = currentView === item.view
              return (
                <button
                  key={item.view}
                  onClick={() => navigate({ name: item.view } as View)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
                    active ? 'bg-primary text-white' : 'bg-muted text-neutral-600'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {item.label}
                </button>
              )
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-1.5 sm:flex"
              onClick={() => navigate({ name: 'home' })}
            >
              <Store className="h-4 w-4" /> Lihat Toko
            </Button>
            <div className="flex items-center gap-2.5 rounded-full border py-1 pl-1 pr-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-xs font-bold text-white">
                  {adminName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-xs font-bold leading-none">{adminName}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">@{adminUsername}</p>
              </div>
              <button
                onClick={() => {
                  logout()
                  navigate({ name: 'home' })
                }}
                className="ml-1 rounded-full p-1.5 text-rose-500 transition-colors hover:bg-rose-50"
                aria-label="Keluar dari panel admin"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <div className="mb-5">
            <h1 className="text-xl font-bold md:text-2xl">{activeMenu?.label || 'Dasbor'}</h1>
          </div>

          {currentView === 'admin-dashboard' && <AdminDashboardView />}
          {currentView === 'admin-products' && <AdminProductsView />}
          {currentView === 'admin-orders' && <AdminOrdersView />}
          {currentView === 'admin-customers' && <AdminCustomersView />}
          {currentView === 'admin-categories' && <AdminCategoriesView />}
          {currentView === 'admin-vouchers' && <AdminVouchersView />}
          {currentView === 'admin-settings' && <AdminSettingsView />}
        </main>
      </div>
    </div>
  )
}
