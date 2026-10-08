import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'
import { slugify } from '@/lib/format'

/** PATCH: update produk */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await context.params
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

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) {
      data.name = String(name).trim()
      const newSlug = slugify(String(name))
      if (newSlug !== existing.slug) {
        const dupe = await db.product.findFirst({ where: { slug: newSlug, id: { not: id } } })
        data.slug = dupe ? `${newSlug}-${Date.now().toString(36)}` : newSlug
      }
    }
    if (description !== undefined) data.description = String(description).trim()
    if (price !== undefined) data.price = parseInt(price, 10) || 0
    if (originalPrice !== undefined)
      data.originalPrice = originalPrice ? parseInt(originalPrice, 10) : null
    if (stock !== undefined) data.stock = parseInt(stock, 10) || 0
    if (image !== undefined)
      data.image = String(image).trim() || 'https://placehold.co/600x600/fdf2f8/ec4899?text=BeautyLoka'
    if (categoryId !== undefined) data.categoryId = categoryId
    if (brandId !== undefined) data.brandId = brandId
    if (isFlashSale !== undefined) {
      data.isFlashSale = Boolean(isFlashSale)
      if (isFlashSale && !existing.flashStock) data.flashStock = existing.stock
    }
    if (flashPrice !== undefined) data.flashPrice = flashPrice ? parseInt(flashPrice, 10) : null
    if (isActive !== undefined) data.isActive = Boolean(isActive)

    const product = await db.product.update({
      where: { id },
      data,
      include: { category: true, brand: true },
    })

    return NextResponse.json({ success: true, product })
  } catch (e) {
    console.error('PATCH /api/admin/products/[id] error', e)
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 })
  }
}

/** DELETE: hapus produk */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await context.params

    const orderItemCount = await db.orderItem.count({ where: { productId: id } })
    if (orderItemCount > 0) {
      // Produk sudah pernah dipesan: nonaktifkan saja agar riwayat pesanan tetap utuh
      await db.product.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: 'Produk pernah dipesan, dinonaktifkan agar riwayat pesanan tetap aman',
      })
    }

    await db.review.deleteMany({ where: { productId: id } })
    await db.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/products/[id] error', e)
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 })
  }
}
