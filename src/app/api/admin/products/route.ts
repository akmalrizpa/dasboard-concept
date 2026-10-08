import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { slugify } from '@/lib/format'

/** GET: daftar semua produk (admin, termasuk non-aktif) + filter */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    const categoryId = searchParams.get('categoryId')

    const products = await db.product.findMany({
      where: {
        ...(q
          ? { OR: [{ name: { contains: q } }, { brand: { name: { contains: q } } }] }
          : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      include: { category: true, brand: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ products })
  } catch (e) {
    console.error('GET /api/admin/products error', e)
    return NextResponse.json({ error: 'Gagal memuat produk' }, { status: 500 })
  }
}

/** POST: buat produk baru */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const {
      name,
      description,
      price,
      originalPrice,
      stock,
      image,
      categoryId,
      brandId,
      isFlashSale,
      flashPrice,
      isActive,
    } = body

    if (!name?.trim() || !price || !categoryId || !brandId) {
      return NextResponse.json(
        { error: 'Nama, harga, kategori, dan brand wajib diisi' },
        { status: 400 }
      )
    }

    // Pastikan slug unik
    let slug = slugify(name)
    const existing = await db.product.findFirst({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now().toString(36)}`

    const product = await db.product.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || '',
        price: parseInt(price, 10) || 0,
        originalPrice: originalPrice ? parseInt(originalPrice, 10) : null,
        stock: parseInt(stock, 10) || 0,
        image: image?.trim() || 'https://placehold.co/600x600/fdf2f8/ec4899?text=BeautyLoka',
        categoryId,
        brandId,
        isFlashSale: Boolean(isFlashSale),
        flashPrice: flashPrice ? parseInt(flashPrice, 10) : null,
        flashStock: isFlashSale ? parseInt(stock, 10) || 0 : 0,
        isActive: isActive !== false,
      },
      include: { category: true, brand: true },
    })

    return NextResponse.json({ success: true, product })
  } catch (e) {
    console.error('POST /api/admin/products error', e)
    return NextResponse.json({ error: 'Gagal membuat produk' }, { status: 500 })
  }
}
