import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { slugify } from '@/lib/format'

/** PATCH: update kategori */
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
      const dupe = await db.category.findFirst({ where: { slug: newSlug, id: { not: id } } })
      data.slug = dupe ? `${newSlug}-${Date.now().toString(36)}` : newSlug
    }
    if (body.image !== undefined) data.image = body.image?.trim() || null
    if (body.icon !== undefined) data.icon = body.icon?.trim() || '✨'
    if (body.sortOrder !== undefined) data.sortOrder = parseInt(body.sortOrder, 10) || 0

    const category = await db.category.update({ where: { id }, data })
    return NextResponse.json({ success: true, category })
  } catch (e) {
    console.error('PATCH /api/admin/categories/[id] error', e)
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 })
  }
}

/** DELETE: hapus kategori (gagal jika masih ada produk) */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await context.params
    const count = await db.product.count({ where: { categoryId: id } })
    if (count > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus: masih ada ${count} produk di kategori ini` },
        { status: 400 }
      )
    }
    await db.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/categories/[id] error', e)
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 })
  }
}
