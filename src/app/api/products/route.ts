import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const q = searchParams.get('q')
    const sort = searchParams.get('sort') || 'newest'
    const flash = searchParams.get('flash')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minRating = searchParams.get('minRating')
    const discounted = searchParams.get('discounted')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const perPage = Math.min(48, parseInt(searchParams.get('perPage') || '24', 10) || 24)

    const where: Prisma.ProductWhereInput = { isActive: true }

    if (category) {
      const cat = await db.category.findUnique({ where: { slug: category } })
      if (!cat) return NextResponse.json({ products: [], total: 0, page, perPage })
      where.categoryId = cat.id
    }
    if (brand) {
      const brands = brand.split(',').filter(Boolean)
      const brandRows = await db.brand.findMany({ where: { slug: { in: brands } } })
      if (brandRows.length === 0) return NextResponse.json({ products: [], total: 0, page, perPage })
      where.brandId = { in: brandRows.map((b) => b.id) } as Prisma.StringFilter
    }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { brand: { name: { contains: q } } },
      ]
    }
    if (flash === 'true') where.isFlashSale = true
    const priceFilter: Prisma.IntFilter = {}
    if (minPrice) priceFilter.gte = parseInt(minPrice, 10)
    if (maxPrice) priceFilter.lte = parseInt(maxPrice, 10)
    if (Object.keys(priceFilter).length > 0) where.price = priceFilter
    if (minRating) where.rating = { gte: parseFloat(minRating) }
    if (discounted === 'true') where.originalPrice = { not: null, gt: 0 }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === 'bestseller'
        ? [{ sold: 'desc' }, { createdAt: 'desc' }]
        : sort === 'price-asc'
          ? [{ price: 'asc' }]
          : sort === 'price-desc'
            ? [{ price: 'desc' }]
            : sort === 'rating'
              ? [{ rating: 'desc' }, { reviewCount: 'desc' }]
              : [{ createdAt: 'desc' }]

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        include: { category: true, brand: true },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({ products, total, page, perPage })
  } catch (e) {
    console.error('GET /api/products error', e)
    return NextResponse.json({ error: 'Gagal memuat produk' }, { status: 500 })
  }
}
