/**
 * BeautyLoka — Seed Konfigurasi Dinamis
 * Jalankan dari root proyek: npx tsx scripts/seed_dynamic.ts   (atau: bun run scripts/seed_dynamic.ts)
 * Mengisi: SiteSetting, FlashSale, ShippingMethod, PaymentMethod, Voucher, Article
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('⚙️ Seeding konfigurasi dinamis...')

  await db.siteSetting.deleteMany()
  await db.flashSale.deleteMany()
  await db.shippingMethod.deleteMany()
  await db.paymentMethod.deleteMany()
  await db.voucher.deleteMany()
  await db.article.deleteMany()

  // ====== SiteSetting (key-value JSON) ======
  const settings: Record<string, unknown> = {
    // Identitas toko
    'site.name': 'BeautyLoka',
    'site.tagline': 'Toko Kecantikan No. 1 Indonesia',
    'site.metaTitle': 'BeautyLoka — Toko Kecantikan No. 1 Indonesia',
    'site.metaDescription':
      'Belanja skincare, makeup, perawatan rambut & tubuh, dan parfum 100% original dengan harga terbaik. Gratis ongkir min. Rp300.000.',
    'site.searchPlaceholder': 'Cari serum, sunscreen, lipstick, brand...',

    // Running text pengumuman di header (array)
    'announcement.texts': [
      'Gratis ongkir min. belanja Rp300.000',
      'Diskon hingga 70% di Flash Sale',
      '100% Produk Original & Bergaransi',
      'Flash Sale setiap hari jam 12.00 WIB',
    ],
    'announcement.active': true,

    // Ongkir
    'shipping.freeThreshold': 300000,

    // Judul section homepage
    'section.categoryTitle': 'Kategori Populer',
    'section.categoryEmoji': '🧴',
    'section.brandTitle': 'Brand Unggulan',
    'section.brandEmoji': '💎',
    'section.recommendTitle': 'Rekomendasi Untukmu',
    'section.recommendEmoji': '✨',
    'section.journalTitle': 'Beauty Journal',
    'section.journalEmoji': '📖',

    // Produk — teks jaminan & info
    'product.guaranteeTitle': 'Jaminan BeautyLoka',
    'product.guaranteeTexts': [
      'GRATIS ongkir min. belanja Rp300.000',
      '100% produk original & bergaransi resmi',
      'Bisa retur dalam 30 hari',
      'Pembayaran aman & terpercaya',
    ],

    // Footer — tentang & kontak
    'footer.about':
      'Destinasi kecantikan nomor 1 di Indonesia. Temukan produk skincare, makeup, dan perawatan diri 100% original dengan harga terbaik.',
    'footer.copyright': '© 2026 BeautyLoka. Seluruh hak cipta dilindungi.',
    'footer.email': 'halo@beautyloka.id',
    'footer.phone': '(021) 555-0123',
    'footer.address': 'Jakarta Selatan, Indonesia',

    // Footer — badge kepercayaan
    'footer.trustBadges': [
      { icon: '🛡️', title: '100% Original', desc: 'Produk bergaransi resmi' },
      { icon: '🚚', title: 'Gratis Ongkir', desc: 'Min. belanja Rp300rb' },
      { icon: '💳', title: 'Pembayaran Aman', desc: 'Beragam metode bayar' },
      { icon: '↩️', title: 'Garansi 30 Hari', desc: 'Uang kembali 100%' },
    ],

    // Footer — badge pembayaran & kurir (tampilan saja)
    'footer.paymentBadges': ['BCA', 'Mandiri', 'BNI', 'GoPay', 'OVO', 'DANA', 'QRIS', 'COD'],
    'footer.courierBadges': ['JNE', 'J&T Express', 'SiCepat', 'AnterAja', 'GoSend', 'GrabExpress'],

    // Footer — media sosial (platform + URL)
    'footer.socials': [
      { platform: 'Instagram', url: 'https://instagram.com/beautyloka' },
      { platform: 'Facebook', url: 'https://facebook.com/beautyloka' },
      { platform: 'Youtube', url: 'https://youtube.com/@beautyloka' },
      { platform: 'Twitter', url: 'https://twitter.com/beautyloka' },
    ],

    // Checkout — rekening untuk instruksi pembayaran
    'checkout.bankName': 'BCA',
    'checkout.bankAccount': '8808 1234 5678',
    'checkout.bankHolder': 'PT BeautyLoka Indonesia',
    'checkout.codFee': 2500,
  }

  for (const [key, value] of Object.entries(settings)) {
    await db.siteSetting.create({ data: { key, value: JSON.stringify(value) } })
  }
  console.log(`✓ ${Object.keys(settings).length} site settings`)

  // ====== FlashSale (jendela aktif: sekarang → 3 hari) ======
  const now = new Date()
  const ends = new Date(now.getTime() + 3 * 24 * 3600 * 1000)
  ends.setHours(23, 59, 59, 999)
  await db.flashSale.create({
    data: { title: 'Flash Sale', startsAt: now, endsAt: ends, isActive: true },
  })
  console.log('✓ 1 jendela flash sale aktif')

  // ====== ShippingMethod ======
  const shippings = [
    { code: 'REGULER', label: 'Reguler', eta: '2-4 hari kerja', cost: 15000, sortOrder: 1 },
    { code: 'KARGO', label: 'Kargo Hemat', eta: '4-7 hari kerja', cost: 9000, sortOrder: 2 },
    { code: 'INSTAN', label: 'Instan', eta: 'Hari ini', cost: 25000, sortOrder: 3 },
  ]
  for (const s of shippings) {
    await db.shippingMethod.create({ data: s })
  }
  console.log(`✓ ${shippings.length} metode pengiriman`)

  // ====== PaymentMethod ======
  const payments = [
    { code: 'BCA', label: 'BCA', group: 'Transfer Bank', desc: 'Virtual Account otomatis', sortOrder: 1 },
    { code: 'MANDIRI', label: 'Mandiri', group: 'Transfer Bank', desc: 'Virtual Account otomatis', sortOrder: 2 },
    { code: 'BNI', label: 'BNI', group: 'Transfer Bank', desc: 'Virtual Account otomatis', sortOrder: 3 },
    { code: 'GOPAY', label: 'GoPay', group: 'E-Wallet', desc: 'Bayar dengan saldo Gojek', sortOrder: 4 },
    { code: 'OVO', label: 'OVO', group: 'E-Wallet', desc: 'Bayar dengan saldo OVO', sortOrder: 5 },
    { code: 'DANA', label: 'DANA', group: 'E-Wallet', desc: 'Bayar dengan saldo DANA', sortOrder: 6 },
    { code: 'QRIS', label: 'QRIS', group: 'Lainnya', desc: 'Scan QR semua aplikasi', sortOrder: 7 },
    { code: 'COD', label: 'COD', group: 'Lainnya', desc: 'Bayar saat paket tiba', fee: 2500, sortOrder: 8 },
  ]
  for (const p of payments) {
    await db.paymentMethod.create({ data: p })
  }
  console.log(`✓ ${payments.length} metode pembayaran`)

  // ====== Voucher ======
  const nextMonth = new Date(now.getTime() + 30 * 24 * 3600 * 1000)
  const vouchers = [
    {
      code: 'BEAUTY10',
      description: 'Diskon 10% maksimal Rp50.000, min. belanja Rp100.000',
      type: 'PERCENT',
      value: 10,
      minPurchase: 100000,
      maxDiscount: 50000,
      expiresAt: nextMonth,
    },
    {
      code: 'HEMAT20K',
      description: 'Potongan Rp20.000, min. belanja Rp150.000',
      type: 'FIXED',
      value: 20000,
      minPurchase: 150000,
      expiresAt: nextMonth,
    },
    {
      code: 'GRATISONGKIR',
      description: 'Bebas ongkir, min. belanja Rp100.000',
      type: 'FREE_SHIPPING',
      value: 0,
      minPurchase: 100000,
      expiresAt: nextMonth,
    },
  ]
  for (const v of vouchers) {
    await db.voucher.create({ data: v })
  }
  console.log(`✓ ${vouchers.length} voucher`)

  // ====== Article (Beauty Journal) ======
  const articles = [
    {
      emoji: '🌅',
      tag: 'Skincare 101',
      title: 'Urutan Skincare Pagi yang Benar untuk Pemula',
      excerpt:
        'Kenali langkah skincare pagi dari cleanser hingga sunscreen agar kulit terlindungi optimal sepanjang hari.',
      sortOrder: 1,
    },
    {
      emoji: '🧪',
      tag: 'Review',
      title: '5 Serum Niacinamide Lokal yang Terbukti Ampuh',
      excerpt:
        'Kulit kusam dan berminyak? Niacinamide jawabannya. Ini rekomendasi serum lokal dengan kualitas internasional.',
      sortOrder: 2,
    },
    {
      emoji: '💄',
      tag: 'Tutorial',
      title: 'Makeup Natural untuk Aktivitas Sehari-hari',
      excerpt:
        'Tampil segar hanya dengan 5 langkah makeup natural yang tahan seharian — cocok untuk kantoran dan kuliah.',
      sortOrder: 3,
    },
  ]
  for (const a of articles) {
    await db.article.create({ data: a })
  }
  console.log(`✓ ${articles.length} artikel`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
