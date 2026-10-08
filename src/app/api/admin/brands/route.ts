import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { slugify } from '@/lib/format'

/** GET: daftar brand dengan jumlah produk */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const brands = await db.brand.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({
      brands: brands.map((b) => ({
        ...b,
        productCount: b._count.products,
        _count: undefined,
      })),
    })
  } catch (e) {
    console.error('GET /api/admin/brands error', e)
    return NextResponse.json({ error: 'Gagal memuat brand' }, { status: 500 })
  }
}

/** POST: buat brand */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { name, isFeatured } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama brand wajib diisi' }, { status: 400 })
    }
    let slug = slugify(name)
    const dupe = await db.brand.findFirst({ where: { slug } })
    if (dupe) slug = `${slug}-${Date.now().toString(36)}`

    const brand = await db.brand.create({
      data: { name: name.trim(), slug, isFeatured: Boolean(isFeatured) },
    })
    return NextResponse.json({ success: true, brand })
  } catch (e) {
    console.error('POST /api/admin/brands error', e)
    return NextResponse.json({ error: 'Gagal membuat brand' }, { status: 500 })
  }
}
