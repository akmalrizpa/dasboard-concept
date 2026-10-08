import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** Data gabungan untuk halaman utama storefront: banner, kategori, brand, flash sale, rekomendasi */
export async function GET() {
  try {
    const [banners, categories, brands, flashSale, bestSellers, newest] = await Promise.all([
      db.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      db.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { products: { where: { isActive: true } } } } },
      }),
      db.brand.findMany({
        where: { isFeatured: true },
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: { where: { isActive: true } } } } },
      }),
      db.product.findMany({
        where: { isActive: true, isFlashSale: true },
        include: { category: true, brand: true },
        orderBy: [{ sold: 'desc' }],
        take: 8,
      }),
      db.product.findMany({
        where: { isActive: true },
        include: { category: true, brand: true },
        orderBy: [{ sold: 'desc' }],
        take: 12,
      }),
      db.product.findMany({
        where: { isActive: true },
        include: { category: true, brand: true },
        orderBy: [{ createdAt: 'desc' }],
        take: 12,
      }),
    ])

    return NextResponse.json({
      banners,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image,
        icon: c.icon,
        productCount: c._count.products,
      })),
      brands: brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        productCount: b._count.products,
      })),
      flashSale,
      bestSellers,
      newest,
    })
  } catch (e) {
    console.error('GET /api/home error', e)
    return NextResponse.json({ error: 'Gagal memuat data beranda' }, { status: 500 })
  }
}
