import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

/** GET: daftar artikel Beauty Journal */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const articles = await db.article.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json({ articles })
  } catch (e) {
    console.error('GET /api/admin/articles error', e)
    return NextResponse.json({ error: 'Gagal memuat artikel' }, { status: 500 })
  }
}

/** POST: buat artikel */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { emoji, tag, title, excerpt, isActive, sortOrder } = await req.json()
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Judul artikel wajib diisi' }, { status: 400 })
    }
    const article = await db.article.create({
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
    console.error('POST /api/admin/articles error', e)
    return NextResponse.json({ error: 'Gagal membuat artikel' }, { status: 500 })
  }
}
