import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

/** PUT: update artikel */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await params
    const { emoji, tag, title, excerpt, isActive, sortOrder } = await req.json()
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Judul artikel wajib diisi' }, { status: 400 })
    }
    const article = await db.article.update({
      where: { id },
      data: {
        emoji: emoji?.trim() || '📖',
        tag: tag?.trim() || 'Artikel',
        title: title.trim(),
        excerpt: excerpt?.trim() || '',
        isActive: isActive !== false,
        sortOrder: parseInt(sortOrder, 10) || 0,
      },
    })
    return NextResponse.json({ success: true, article })
  } catch (e) {
    console.error('PUT /api/admin/articles/[id] error', e)
    return NextResponse.json({ error: 'Gagal memperbarui artikel' }, { status: 500 })
  }
}

/** DELETE: hapus artikel */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await params
    await db.article.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/articles/[id] error', e)
    return NextResponse.json({ error: 'Gagal menghapus artikel' }, { status: 500 })
  }
}
