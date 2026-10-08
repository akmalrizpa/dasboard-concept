import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth'

/** GET: semua jendela flash sale (terbaru dulu) + yang sedang aktif */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const now = new Date()
    const [flashSales, active] = await Promise.all([
      db.flashSale.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      db.flashSale.findFirst({
        where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      }),
    ])
    return NextResponse.json({ flashSales, active: active || null })
  } catch (e) {
    console.error('GET /api/admin/flash-sale error', e)
    return NextResponse.json({ error: 'Gagal memuat data flash sale' }, { status: 500 })
  }
}

/** POST: buat jendela flash sale baru (otomatis nonaktifkan yang lain) */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { title, startsAt, endsAt, isActive } = await req.json()
    if (!startsAt || !endsAt) {
      return NextResponse.json({ error: 'Waktu mulai dan selesai wajib diisi' }, { status: 400 })
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      return NextResponse.json({ error: 'Waktu selesai harus setelah waktu mulai' }, { status: 400 })
    }

    // Hanya satu jendela aktif: matikan lainnya
    if (isActive) {
      await db.flashSale.updateMany({ data: { isActive: false } })
    }

    const flashSale = await db.flashSale.create({
      data: {
        title: title?.trim() || 'Flash Sale',
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        isActive: Boolean(isActive),
      },
    })
    return NextResponse.json({ success: true, flashSale })
  } catch (e) {
    console.error('POST /api/admin/flash-sale error', e)
    return NextResponse.json({ error: 'Gagal membuat flash sale' }, { status: 500 })
  }
}

/** PUT: update jendela flash sale. Body: { id, title, startsAt, endsAt, isActive } */
export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id, title, startsAt, endsAt, isActive } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    if (!startsAt || !endsAt) {
      return NextResponse.json({ error: 'Waktu mulai dan selesai wajib diisi' }, { status: 400 })
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      return NextResponse.json({ error: 'Waktu selesai harus setelah waktu mulai' }, { status: 400 })
    }

    if (isActive) {
      await db.flashSale.updateMany({ data: { isActive: false } })
    }

    const flashSale = await db.flashSale.update({
      where: { id },
      data: {
        title: title?.trim() || 'Flash Sale',
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        isActive: Boolean(isActive),
      },
    })
    return NextResponse.json({ success: true, flashSale })
  } catch (e) {
    console.error('PUT /api/admin/flash-sale error', e)
    return NextResponse.json({ error: 'Gagal memperbarui flash sale' }, { status: 500 })
  }
}

/** DELETE: hapus jendela flash sale — Body: { id } */
export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    await db.flashSale.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/flash-sale error', e)
    return NextResponse.json({ error: 'Gagal menghapus flash sale' }, { status: 500 })
  }
}
