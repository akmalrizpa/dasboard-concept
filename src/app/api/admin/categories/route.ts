import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { slugify } from '@/lib/format'

/** GET: daftar kategori dengan jumlah produk */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const categories = await db.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({
      categories: categories.map((c) => ({
        ...c,
        productCount: c._count.products,
        _count: undefined,
      })),
    })
  } catch (e) {
    console.error('GET /api/admin/categories error', e)
    return NextResponse.json({ error: 'Gagal memuat kategori' }, { status: 500 })
  }
}

/** POST: buat kategori */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { name, image, icon, sortOrder } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })
    }
    let slug = slugify(name)
    const dupe = await db.category.findFirst({ where: { slug } })
    if (dupe) slug = `${slug}-${Date.now().toString(36)}`

    const category = await db.category.create({
      data: {
        name: name.trim(),
        slug,
        image: image?.trim() || null,
        icon: icon?.trim() || '✨',
        sortOrder: parseInt(sortOrder, 10) || 0,
      },
    })
    return NextResponse.json({ success: true, category })
  } catch (e) {
    console.error('POST /api/admin/categories error', e)
    return NextResponse.json({ error: 'Gagal membuat kategori' }, { status: 500 })
  }
}
