import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    const related = await db.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      include: { category: true, brand: true },
      orderBy: [{ sold: 'desc' }],
      take: 8,
    })

    return NextResponse.json({ product, related })
  } catch (e) {
    console.error('GET /api/products/[slug] error', e)
    return NextResponse.json({ error: 'Gagal memuat detail produk' }, { status: 500 })
  }
}
