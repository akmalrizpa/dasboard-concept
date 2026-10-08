import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, makeSalt, createAdminToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = (await req.json()) as { username?: string; password?: string }

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
    }

    const admin = await db.admin.findUnique({ where: { username: username.trim().toLowerCase() } })
    if (!admin) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    const hashed = hashPassword(password, admin.salt)
    if (hashed !== admin.password) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    const token = createAdminToken(admin.username)
    return NextResponse.json({
      success: true,
      token,
      admin: { username: admin.username, name: admin.name },
    })
  } catch (e) {
    console.error('POST /api/admin/login error', e)
    return NextResponse.json({ error: 'Gagal masuk. Silakan coba lagi.' }, { status: 500 })
  }
}
