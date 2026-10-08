'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import HomePage from '@/components/store/HomePage'
import ProductsView from '@/components/store/ProductsView'
import ProductDetailView from '@/components/store/ProductDetailView'
import CartView from '@/components/store/CartView'
import CheckoutView from '@/components/store/CheckoutView'
import SuccessView from '@/components/store/SuccessView'
import TrackOrderView from '@/components/store/TrackOrderView'
import AdminShell from '@/components/admin/AdminShell'
import { useAppStore } from '@/store/useAppStore'
import type { HomeData, Category, Brand } from '@/lib/types'

export default function Page() {
  const view = useAppStore((s) => s.view)

  const [homeData, setHomeData] = useState<HomeData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [homeLoading, setHomeLoading] = useState(true)

  // Muat data dasar (kategori & brand untuk header/footer/filter)
  useEffect(() => {
    let cancelled = false
    fetch('/api/home')
      .then(async (res) => {
        if (!res.ok) throw new Error('Gagal memuat data')
        return res.json()
      })
      .then((data: HomeData) => {
        if (cancelled) return
        setHomeData(data)
        setCategories(data.categories)
        setBrands(data.brands)
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (!cancelled) setHomeLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ===== Mode Admin =====
  if (view.name.startsWith('admin')) {
    return <AdminShell />
  }

  // ===== Mode Storefront =====
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header categories={categories} />

      <div className="flex flex-1 flex-col">
        {view.name === 'home' && <HomePage data={homeData} loading={homeLoading} />}
        {view.name === 'products' && <ProductsView categories={categories} brands={brands} />}
        {view.name === 'product' && <ProductDetailView key={view.slug} slug={view.slug} />}
        {view.name === 'cart' && <CartView />}
        {view.name === 'checkout' && <CheckoutView />}
        {view.name === 'success' && (
          <SuccessView
            orderNumber={view.orderNumber}
            total={view.total}
            paymentMethod={view.paymentMethod}
          />
        )}
        {view.name === 'track' && <TrackOrderView />}
      </div>

      <Footer categories={categories} />
    </div>
  )
}
