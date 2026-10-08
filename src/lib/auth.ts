import { createHmac, timingSafeEqual, randomBytes, createHash } from 'crypto'

const SECRET =
  process.env.ADMIN_TOKEN_SECRET || 'beautyloka-secret-key-2026-change-in-production'

export const ADMIN_TOKEN_EXPIRY_MS = 1000 * 60 * 60 * 12 // 12 jam

/** Hash password dengan salt: sha256(salt + password) */
export function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex')
}

export function makeSalt(): string {
  return randomBytes(16).toString('hex')
}

/** Buat signed token admin: base64(payload).hmac */
export function createAdminToken(username: string): string {
  const payload = JSON.stringify({
    username,
    role: 'admin',
    exp: Date.now() + ADMIN_TOKEN_EXPIRY_MS,
  })
  const body = Buffer.from(payload).toString('base64url')
  const sig = createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

/** Verifikasi token admin, return payload atau null */
export function verifyAdminToken(
  token: string | null | undefined
): { username: string; role: string; exp: number } | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null

  const expectedSig = createHmac('sha256', SECRET).update(body).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expectedSig)
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      username: string
      role: string
      exp: number
    }
    if (payload.exp < Date.now() || payload.role !== 'admin') return null
    return payload
  } catch {
    return null
  }
}

/** Helper untuk API route: ambil & verifikasi token dari header Authorization */
export function isAdminRequest(req: Request): boolean {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  return verifyAdminToken(token) !== null
}
