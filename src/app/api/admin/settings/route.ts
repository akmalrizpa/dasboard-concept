import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { getSettings, saveSettings } from '@/lib/settings'

/** GET: semua site settings (ter-parse) */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const settings = await getSettings()
    return NextResponse.json({ settings })
  } catch (e) {
    console.error('GET /api/admin/settings error', e)
    return NextResponse.json({ error: 'Gagal memuat pengaturan' }, { status: 500 })
  }
}

/** PUT: simpan batch pengaturan. Body: { items: [{ key, value }] } */
export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }
  try {
    const body = (await req.json()) as { items?: { key: string; value: unknown }[] }
    if (!body.items?.length) {
      return NextResponse.json({ error: 'Tidak ada data untuk disimpan' }, { status: 400 })
    }
    await saveSettings(body.items)
    const settings = await getSettings()
    return NextResponse.json({ success: true, settings })
  } catch (e) {
    console.error('PUT /api/admin/settings error', e)
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 })
  }
}
