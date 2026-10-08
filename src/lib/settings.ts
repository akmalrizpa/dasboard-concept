import { db } from '@/lib/db'

/** Nilai default jika key tidak ada di DB — dipakai sebagai fallback aman */
export const SETTING_DEFAULTS: Record<string, unknown> = {
  'site.name': 'BeautyLoka',
  'site.tagline': 'Toko Kecantikan No. 1 Indonesia',
  'site.metaTitle': 'BeautyLoka — Toko Kecantikan No. 1 Indonesia',
  'site.metaDescription':
    'Belanja skincare, makeup, perawatan rambut & tubuh, dan parfum 100% original dengan harga terbaik.',
  'site.searchPlaceholder': 'Cari serum, sunscreen, lipstick, brand...',
  'announcement.texts': [
    'Gratis ongkir min. belanja Rp300.000',
    'Diskon hingga 70% di Flash Sale',
    '100% Produk Original & Bergaransi',
  ],
  'announcement.active': true,
  'shipping.freeThreshold': 300000,
  'section.categoryTitle': 'Kategori Populer',
  'section.categoryEmoji': '🧴',
  'section.brandTitle': 'Brand Unggulan',
  'section.brandEmoji': '💎',
  'section.recommendTitle': 'Rekomendasi Untukmu',
  'section.recommendEmoji': '✨',
  'section.journalTitle': 'Beauty Journal',
  'section.journalEmoji': '📖',
  'product.guaranteeTitle': 'Jaminan BeautyLoka',
  'product.guaranteeTexts': [
    'GRATIS ongkir min. belanja Rp300.000',
    '100% produk original & bergaransi resmi',
    'Bisa retur dalam 30 hari',
    'Pembayaran aman & terpercaya',
  ],
  'footer.about':
    'Destinasi kecantikan nomor 1 di Indonesia. Temukan produk skincare, makeup, dan perawatan diri 100% original dengan harga terbaik.',
  'footer.copyright': '© 2026 BeautyLoka. Seluruh hak cipta dilindungi.',
  'footer.email': 'halo@beautyloka.id',
  'footer.phone': '(021) 555-0123',
  'footer.address': 'Jakarta Selatan, Indonesia',
  'footer.trustBadges': [
    { icon: '🛡️', title: '100% Original', desc: 'Produk bergaransi resmi' },
    { icon: '🚚', title: 'Gratis Ongkir', desc: 'Min. belanja Rp300rb' },
    { icon: '💳', title: 'Pembayaran Aman', desc: 'Beragam metode bayar' },
    { icon: '↩️', title: 'Garansi 30 Hari', desc: 'Uang kembali 100%' },
  ],
  'footer.paymentBadges': ['BCA', 'Mandiri', 'BNI', 'GoPay', 'OVO', 'DANA', 'QRIS', 'COD'],
  'footer.courierBadges': ['JNE', 'J&T Express', 'SiCepat', 'AnterAja', 'GoSend', 'GrabExpress'],
  'footer.socials': [
    { platform: 'Instagram', url: 'https://instagram.com/beautyloka' },
    { platform: 'Facebook', url: 'https://facebook.com/beautyloka' },
    { platform: 'Youtube', url: 'https://youtube.com/@beautyloka' },
    { platform: 'Twitter', url: 'https://twitter.com/beautyloka' },
  ],
  'checkout.bankName': 'BCA',
  'checkout.bankAccount': '8808 1234 5678',
  'checkout.bankHolder': 'PT BeautyLoka Indonesia',
  'checkout.codFee': 2500,
}

export type SettingsMap = Record<string, unknown>

/** Ambil semua setting dari DB (dengan fallback default), sudah ter-parse dari JSON */
export async function getSettings(): Promise<SettingsMap> {
  const rows = await db.siteSetting.findMany()
  const map: SettingsMap = { ...SETTING_DEFAULTS }
  for (const row of rows) {
    try {
      map[row.key] = JSON.parse(row.value)
    } catch {
      map[row.key] = row.value
    }
  }
  return map
}

/** Simpan batch setting (upsert). items: { key, value } — value akan di-JSON.stringify */
export async function saveSettings(items: { key: string; value: unknown }[]): Promise<void> {
  for (const item of items) {
    await db.siteSetting.upsert({
      where: { key: item.key },
      update: { value: JSON.stringify(item.value) },
      create: { key: item.key, value: JSON.stringify(item.value) },
    })
  }
}

/** Ambil jendela flash sale yang sedang aktif saat ini (null jika tidak ada) */
export async function getActiveFlashSale() {
  const now = new Date()
  const fs = await db.flashSale.findFirst({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { endsAt: 'asc' },
  })
  return fs
}
