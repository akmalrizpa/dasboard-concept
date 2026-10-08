import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { slugify } from '@/lib/format'

/** PATCH: update brand */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await context.params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) {
      data.name = String(body.name).trim()
      const newSlug = slugify(String(body.name))
      const dupe = await db.brand.findFirst({ where: { slug: newSlug, id: { not: id } } })
      data.slug = dupe ? `${newSlug}-${Date.now().toString(36)}` : newSlug
    }
    if (body.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured)

    const brand = await db.brand.update({ where: { id }, data })
    return NextResponse.json({ success: true, brand })
  } catch (e) {
    console.error('PATCH /api/admin/brands/[id] error', e)
    return NextResponse.json({ error: 'Gagal memperbarui brand' }, { status: 500 })
  }
}

/** DELETE: hapus brand (gagal jika masih ada produk) */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await context.params
    const count = await db.product.count({ where: { brandId: id } })
    if (count > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus: masih ada ${count} produk dari brand ini` },
        { status: 400 }
      )
    }
    await db.brand.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/brands/[id] error', e)
    return NextResponse.json({ error: 'Gagal menghapus brand' }, { status: 500 })
  }
}
