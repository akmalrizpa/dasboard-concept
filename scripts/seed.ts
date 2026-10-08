/**
 * BeautyLoka — Seed Script
 * Jalankan: cd /home/z/my-project && bun run scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import { createHash, randomBytes } from 'crypto'

const db = new PrismaClient()

// ====== Util ======
const img = (key: string, i: number) => {
  // loaded dynamically from all_urls.json
  return IMG[key][i % IMG[key].length]
}
function hashPassword(password: string, salt: string) {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex')
}

// ====== Load image URLs ======
import { readFileSync } from 'fs'
const IMG: Record<string, string[]> = JSON.parse(
  readFileSync('/home/z/my-project/scripts/img/all_urls.json', 'utf-8')
)

async function main() {
  console.log('🌱 Seeding BeautyLoka...')

  // Bersihkan data lama
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.review.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.brand.deleteMany()
  await db.customer.deleteMany()
  await db.admin.deleteMany()
  await db.banner.deleteMany()

  // ====== Admin ======
  const salt = randomBytes(16).toString('hex')
  await db.admin.create({
    data: {
      username: 'admin',
      password: hashPassword('admin123', salt),
      salt,
      name: 'Admin BeautyLoka',
    },
  })
  console.log('✓ Admin dibuat (admin / admin123)')

  // ====== Kategori ======
  const catData = [
    { name: 'Skincare', slug: 'skincare', icon: '🧖‍♀️', image: img('serum', 7), sortOrder: 1 },
    { name: 'Make Up', slug: 'make-up', icon: '💄', image: img('lipstick', 5), sortOrder: 2 },
    { name: 'Perawatan Rambut', slug: 'perawatan-rambut', icon: '💇‍♀️', image: img('shampoo', 4), sortOrder: 3 },
    { name: 'Tubuh & Mandi', slug: 'tubuh-mandi', icon: '🛁', image: img('bodylotion', 4), sortOrder: 4 },
    { name: 'Parfum', slug: 'parfum', icon: '🌸', image: img('perfume', 4), sortOrder: 5 },
    { name: 'Peralatan Kecantikan', slug: 'peralatan-kecantikan', icon: '🪞', image: img('tools', 3), sortOrder: 6 },
  ]
  const cats: Record<string, string> = {}
  for (const c of catData) {
    const row = await db.category.create({ data: c })
    cats[c.slug] = row.id
  }
  console.log(`✓ ${catData.length} kategori`)

  // ====== Brand ======
  const brandNames = [
    'Somethinc', 'Azarine', 'Wardah', 'Skintific', 'Avoskin', 'Emina',
    'Make Over', 'Maybelline', 'Cetaphil', 'The Body Shop', 'Elizabeth Arden', 'Pantene',
  ]
  const brands: Record<string, string> = {}
  for (const name of brandNames) {
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    const row = await db.brand.create({
      data: { name, slug, isFeatured: true },
    })
    brands[name] = row.id
  }
  console.log(`✓ ${brandNames.length} brand`)

  // ====== Produk ======
  interface P {
    name: string; brand: string; cat: string; price: number; orig?: number; stock: number;
    rating: number; reviews: number; sold: number; image: string; desc: string;
    flash?: number; flashStock?: number; flashSold?: number;
  }

  const products: P[] = [
    // --- Skincare ---
    {
      name: 'BARE WITH ME 0.1% Retinol Facial Serum', brand: 'Somethinc', cat: 'skincare',
      price: 139000, orig: 189000, stock: 85, rating: 4.9, reviews: 1240, sold: 3200,
      image: img('serum', 0), flash: 99000, flashStock: 50, flashSold: 38,
      desc: 'Serum retinol 0.1% untuk pemula yang membantu mempercepat regenerasi sel kulit, menghaluskan tekstur kulit, dan mengurangi garis halus. Diperkaya niacinamide dan squalane agar lembut di kulit. Cocok untuk kulit kusam, bertekstur, dan mulai menunjukkan tanda penuaan.',
    },
    {
      name: '5% Niacinamide + Moisture B5 Serum', brand: 'Skintific', cat: 'skincare',
      price: 109000, orig: 145000, stock: 120, rating: 4.8, reviews: 2150, sold: 5400,
      image: img('serum', 3),
      desc: 'Serum niacinamide 5% dengan vitamin B5 yang melembapkan. Membantu menyamarkan noda bekas jerawat, mengontrol minyak berlebih, dan mencerahkan kulit wajah. Formula ringan cepat meresap tanpa rasa lengket.',
    },
    {
      name: 'The Great Shield Vitamin C Brightening Serum', brand: 'Avoskin', cat: 'skincare',
      price: 129000, orig: 159000, stock: 64, rating: 4.8, reviews: 890, sold: 2100,
      image: img('serum', 2),
      desc: 'Serum vitamin C dengan antioksidan untuk melindungi kulit dari radikal bebas, mencerahkan kulit kusam, dan meratakan warna kulit. Diperkaya ekstrak alami pilihan yang lembut untuk penggunaan harian.',
    },
    {
      name: 'Hydrasoothe Sunscreen Gel SPF 45 PA++++', brand: 'Azarine', cat: 'skincare',
      price: 69000, orig: 89000, stock: 200, rating: 4.9, reviews: 3400, sold: 8700,
      image: img('sunscreen', 0), flash: 55000, flashStock: 100, flashSold: 81,
      desc: 'Sunscreen gel ringan dengan SPF 45 PA++++ yang memberikan perlindungan luas terhadap UVA dan UVB. Tekstur gel cepat menyerap, tidak whitecast, dan melembapkan kulit. Aman untuk kulit sensitif dan berjerawat.',
    },
    {
      name: 'Sun Protection SPF 30 PA+++', brand: 'Emina', cat: 'skincare',
      price: 35000, orig: 45000, stock: 150, rating: 4.7, reviews: 1890, sold: 6500,
      image: img('sunscreen', 1),
      desc: 'Sunscreen harian dengan SPF 30 PA+++ yang ringan dan tidak lengket. Melindungi kulit dari sengatan matahari sepanjang aktivitas. Dilengkapi kandungan vitamin E untuk nutrisi kulit ekstra.',
    },
    {
      name: 'Everyday Sunscreen SPF 50+ PA++++', brand: 'Skintific', cat: 'skincare',
      price: 89000, orig: 109000, stock: 90, rating: 4.8, reviews: 1560, sold: 4300,
      image: img('sunscreen', 3),
      desc: 'Sunscreen SPF 50+ PA++++ dengan tekstur ringan seperti lotion. Memberikan perlindungan maksimal tanpa rasa berat atau lengket. Bisa digunakan sebagai makeup base karena hasil akhirnya dewy dan natural.',
    },
    {
      name: 'Gentle Skin Cleanser 125ml', brand: 'Cetaphil', cat: 'skincare',
      price: 105000, orig: 125000, stock: 75, rating: 4.9, reviews: 2100, sold: 5100,
      image: img('cleanser', 0),
      desc: 'Pembersih wajah lembut yang teruji klinis untuk semua jenis kulit, termasuk kulit sensitif. Mengangkat kotoran dan minyak tanpa mengiritasi atau membuat kulit kering. Bebas sabun dan non-komedogenik.',
    },
    {
      name: 'Pure Balance Hydrating Facial Cleanser', brand: 'Avoskin', cat: 'skincare',
      price: 89000, orig: 109000, stock: 110, rating: 4.8, reviews: 720, sold: 1900,
      image: img('cleanser', 1),
      desc: 'Facial cleanser dengan kandungan hyaluronic acid dan ekstrak alami yang membersihkan secara menyeluruh sambil menjaga kelembapan kulit. Busa lembut yang tidak menyebabkan rasa tertarik setelah bilas.',
    },
    {
      name: 'Lightening Day Cream SPF 30', brand: 'Wardah', cat: 'skincare',
      price: 45000, orig: 59000, stock: 180, rating: 4.7, reviews: 2650, sold: 7800,
      image: img('moisturizer', 0), flash: 39000, flashStock: 80, flashSold: 65,
      desc: 'Krim siang dengan SPF 30 yang mencerahkan dan merawat kulit sepanjang hari. Mengandung vitamin B3 dan ekstrak mulberry untuk membantu menyamarkan noda gelap. Tekstur ringan mudah meresap.',
    },
    {
      name: 'Moisturizing Cream 340g', brand: 'Cetaphil', cat: 'skincare',
      price: 165000, orig: 195000, stock: 55, rating: 4.9, reviews: 1350, sold: 2900,
      image: img('moisturizer', 1),
      desc: 'Krim pelembap intensif untuk kulit sangat kering dan sensitif. Formula kaya emollient yang mengunci kelembapan hingga 48 jam. Teruji klinis dan direkomendasikan dokter kulit.',
    },
    {
      name: 'Moisturizing Magic Cream', brand: 'Skintific', cat: 'skincare',
      price: 99000, orig: 129000, stock: 130, rating: 4.8, reviews: 1980, sold: 4700,
      image: img('moisturizer', 2),
      desc: 'Krim pelembap dengan ceramide dan hyaluronic acid yang memperbaiki skin barrier. Memberikan hidrasi mendalam tanpa rasa berat. Cocok untuk kulit kering, dehidrasi, dan sensitif.',
    },
    {
      name: 'Calm Down! Anti-Acne Clay Mask', brand: 'Somethinc', cat: 'skincare',
      price: 59000, orig: 79000, stock: 95, rating: 4.7, reviews: 860, sold: 2400,
      image: img('mask', 0),
      desc: 'Masker tanah liat untuk kulit berjerawat dan berminyak. Mengangkat minyak berlebih, menenangkan peradangan, dan membantu mengeringkan jerawat dengan cepat. Diperkaya tea tree dan centella asiatica.',
    },
    {
      name: 'Brightening Sheet Mask Series', brand: 'Azarine', cat: 'skincare',
      price: 29900, orig: 39900, stock: 300, rating: 4.6, reviews: 1450, sold: 6200,
      image: img('mask', 1),
      desc: 'Sheet mask dengan essence pencerah yang memberikan hidrasi instan. Mengandung niacinamide dan ekstrak bunga untuk kulit lebih cerah dan lembap dalam 15 menit.',
    },
    // --- Make Up ---
    {
      name: 'SuperStay Matte Ink Liquid Lipstick #120 Artist', brand: 'Maybelline', cat: 'make-up',
      price: 145000, orig: 175000, stock: 70, rating: 4.8, reviews: 3100, sold: 7400,
      image: img('lipstick', 4), flash: 119000, flashStock: 40, flashSold: 33,
      desc: 'Lipstik cair matte dengan daya tahan hingga 16 jam sekali oles. Pigmen intens satu lapis langsung pekat, hasil akhir matte tanpa membuat bibir kering. Tidak luntur saat makan dan minum.',
    },
    {
      name: 'Be Matte Lip Coat', brand: 'Somethinc', cat: 'make-up',
      price: 89000, orig: 105000, stock: 85, rating: 4.7, reviews: 1670, sold: 3900,
      image: img('lipstick', 1),
      desc: 'Lipstik matte lokal dengan tekstur ringan seperti whipped cream. Warna pekat sekali swipe, nyaman digunakan seharian, dan tidak transfer-proof di masker.',
    },
    {
      name: 'Ultimatte Longwear Lipstick', brand: 'Make Over', cat: 'make-up',
      price: 95000, orig: 115000, stock: 60, rating: 4.8, reviews: 940, sold: 2200,
      image: img('lipstick', 2),
      desc: 'Lipstik matte mewah dengan formula longwear yang tahan hingga 12 jam. Kandungan vitamin E dan argan oil menjaga bibir tetap lembap. Kemasan elegan ber-bullet emas.',
    },
    {
      name: 'Exclusive Matte Lipstick', brand: 'Wardah', cat: 'make-up',
      price: 68000, orig: 82000, stock: 140, rating: 4.6, reviews: 2100, sold: 5600,
      image: img('lipstick', 3),
      desc: 'Lipstik matte halal dengan kandungan ekstrak alami yang menyehatkan bibir. Warna-warna netral yang cocok untuk penggunaan harian dan hijabers.',
    },
    {
      name: 'Fit Me Matte + Poreless Foundation', brand: 'Maybelline', cat: 'make-up',
      price: 119000, orig: 139000, stock: 95, rating: 4.7, reviews: 2800, sold: 6800,
      image: img('foundation', 0),
      desc: 'Foundation matte yang menyamarkan pori-pori dan mengontrol minyak hingga 12 jam. Formula micro-blurring untuk hasil akhir natural seperti kulit kedua. Tersedia banyak shade untuk kulit Indonesia.',
    },
    {
      name: 'Powerstay Full Coverage Foundation', brand: 'Make Over', cat: 'make-up',
      price: 165000, orig: 199000, stock: 48, rating: 4.8, reviews: 1150, sold: 2600,
      image: img('foundation', 1),
      desc: 'Foundation full coverage dengan daya tahan 24 jam. Melebur sempurna di kulit, tahan terhadap keringat dan aktivitas outdoor. Hasil akhir satin yang tetap terlihat natural.',
    },
    {
      name: 'Bright Stuff Eye Palette', brand: 'Emina', cat: 'make-up',
      price: 79000, orig: 95000, stock: 72, rating: 4.6, reviews: 1380, sold: 3400,
      image: img('palette', 0),
      desc: 'Palet eyeshadow dengan 8 warna pigmented yang mudah diblend. Berisi kombinasi shade matte dan shimmer untuk look harian hingga party. Formula buttery yang tidak bertebaran.',
    },
    // --- Rambut ---
    {
      name: 'Hair Fall Rescue Shampoo 340ml', brand: 'Pantene', cat: 'perawatan-rambut',
      price: 55000, orig: 69000, stock: 160, rating: 4.7, reviews: 1450, sold: 4200,
      image: img('shampoo', 0),
      desc: 'Sampo anti rontok dengan Pro-Vitamin formula yang menutrisi rambut dari akar hingga ujung. Membantu mengurangi kerontokan hingga 98% dengan penggunaan rutin. Aroma segar tahan lama.',
    },
    {
      name: 'Pro-V Total Care Shampoo 170ml', brand: 'Pantene', cat: 'perawatan-rambut',
      price: 62000, orig: 75000, stock: 120, rating: 4.6, reviews: 980, sold: 2800,
      image: img('shampoo', 1),
      desc: 'Sampo perawatan total untuk rambut sehat berkilau. Membersihkan dengan lembut sambil memberikan nutrisi menyeluruh. Cocok untuk semua jenis rambut.',
    },
    {
      name: 'Keratin Smooth Shampoo 340ml', brand: 'Pantene', cat: 'perawatan-rambut',
      price: 68000, orig: 85000, stock: 100, rating: 4.7, reviews: 1120, sold: 3100,
      image: img('shampoo', 2),
      desc: 'Sampo dengan keratin yang menghaluskan rambut kasar dan mengurus. Membuat rambut lebih mudah diatur dan bebas kusut sejak cuci pertama. Wangi tahan hingga 24 jam.',
    },
    {
      name: 'Hair Energy Serum Tonic', brand: 'Make Over', cat: 'perawatan-rambut',
      price: 75000, orig: 89000, stock: 66, rating: 4.5, reviews: 460, sold: 1200,
      image: img('shampoo', 3),
      desc: 'Serum tonik rambut yang menutrisi kulit kepala dan mengurangi kerontokan. Diperkaya minyak alami dan vitamin yang menstimulasi pertumbuhan rambut sehat.',
    },
    // --- Tubuh & Mandi ---
    {
      name: 'Intensive Care Body Lotion 600ml', brand: 'Cetaphil', cat: 'tubuh-mandi',
      price: 48000, orig: 59000, stock: 210, rating: 4.7, reviews: 1980, sold: 5400,
      image: img('bodylotion', 0),
      desc: 'Lotion pelembap intensif untuk kulit tubuh yang sangat kering. Cepat meresap, tidak lengket, dan memberikan kelembapan tahan lama. Aroma lembut yang disukai semua orang.',
    },
    {
      name: 'Smooth Daily Body Lotion 250ml', brand: 'The Body Shop', cat: 'tubuh-mandi',
      price: 52000, orig: 65000, stock: 130, rating: 4.6, reviews: 870, sold: 2300,
      image: img('bodylotion', 1),
      desc: 'Body lotion harian dengan kandungan cocoa butter yang melembapkan dan melembutkan kulit. Tekstur ringan cepat meresap untuk kulit halus sepanjang hari.',
    },
    {
      name: 'Moisturizing Lotion 473ml', brand: 'Cetaphil', cat: 'tubuh-mandi',
      price: 138000, orig: 165000, stock: 45, rating: 4.8, reviews: 640, sold: 1500,
      image: img('bodylotion', 2),
      desc: 'Lotion pelembap ringan untuk kulit sensitif. Formula bebas pewangi yang menenangkan kulit kering dan gatal. Teruji dermatologis untuk penggunaan seluruh keluarga.',
    },
    // --- Parfum ---
    {
      name: 'White Musk Eau de Parfum 30ml', brand: 'The Body Shop', cat: 'parfum',
      price: 389000, orig: 429000, stock: 35, rating: 4.8, reviews: 720, sold: 1600,
      image: img('perfume', 0),
      desc: 'Parfum ikonik dengan aroma musk lembut, floral, dan woody yang elegan. Daya tahan panjang dengan sillage yang memikat. Cocok untuk acara formal maupun harian.',
    },
    {
      name: 'Green Tea Scent Spray 100ml', brand: 'Elizabeth Arden', cat: 'parfum',
      price: 420000, orig: 550000, stock: 28, rating: 4.7, reviews: 540, sold: 1300,
      image: img('perfume', 1), flash: 349000, flashStock: 20, flashSold: 17,
      desc: 'Body mist segar dengan aroma teh hijau, bergamot, dan mint yang menenangkan. Memberikan kesan bersih dan energik. Ideal untuk penggunaan siang hari.',
    },
    {
      name: 'Sunset Bloom Eau de Parfum 50ml', brand: 'Somethinc', cat: 'parfum',
      price: 265000, orig: 320000, stock: 40, rating: 4.8, reviews: 380, sold: 950,
      image: img('perfume', 2),
      desc: 'Parfum dengan opening citrus segar yang berkembang menjadi floral heart notes dan base yang warm. Botol premium yang Instagramable, cocok untuk koleksi parfum lokal.',
    },
    // --- Peralatan ---
    {
      name: 'Professional Brush Set 12 pcs', brand: 'Make Over', cat: 'peralatan-kecantikan',
      price: 189000, orig: 235000, stock: 42, rating: 4.8, reviews: 560, sold: 1400,
      image: img('tools', 0),
      desc: 'Set 12 kuas makeup profesional dengan bulu sintetis premium lembut di kulit. Handle kayu ergonomis dengan kantong roll pouch untuk traveling. Lengkap dari foundation hingga blending.',
    },
    {
      name: 'Everyday Beauty Tool Kit', brand: 'Emina', cat: 'peralatan-kecantikan',
      price: 129000, orig: 159000, stock: 58, rating: 4.6, reviews: 410, sold: 1100,
      image: img('tools', 1),
      desc: 'Paket alat kecantikan sehari-hari berisi beauty blender, kuas dasar, dan sharpener. Semua yang dibutuhkan pemula untuk mulai ber-makeup dalam satu set yang praktis.',
    },
  ]

  const slugify = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')

  const productIds: { id: string; name: string; image: string; price: number }[] = []
  for (const p of products) {
    const row = await db.product.create({
      data: {
        name: p.name,
        slug: slugify(p.name),
        description: p.desc,
        price: p.price,
        originalPrice: p.orig ?? null,
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.reviews,
        sold: p.sold,
        image: p.image,
        isFlashSale: p.flash !== undefined,
        flashPrice: p.flash ?? null,
        flashStock: p.flashStock ?? 0,
        flashSold: p.flashSold ?? 0,
        isActive: true,
        categoryId: cats[p.cat],
        brandId: brands[p.brand],
      },
    })
    productIds.push({ id: row.id, name: p.name, image: p.image, price: p.flash ?? p.price })
  }
  console.log(`✓ ${products.length} produk`)

  // ====== Review ======
  const reviewTexts: [string, number, string][] = [
    ['Dewi Lestari', 5, 'Produknya original, packing rapi banget pakai bubble wrap. hasilnya udah keliatan setelah 2 minggu pemakaian, kulit lebih cerah!'],
    ['Putri Ayu', 5, 'Suka banget sama teksturnya, ringan dan cepat meresap. Wanginya juga enak, gak bikin lengket. Bakal repurchase!'],
    ['Sarah Amelia', 4, 'Kualitas oke, tapi pengiriman agak lama. Untuk produknya sendiri recommended sih, cocok buat kulit sensitif kayak saya.'],
    ['Rina Marlina', 5, 'Ini udah pembelian ke-3, gak pernah kecewa. Harga di BeautyLoka lebih murah dari toko lain dan pasti original.'],
    ['Jessica Wong', 5, 'Langsung jatuh cinta! Packaging premium, hasilnya natural. Teman-teman sampai nanya pakai apa.'],
    ['Anisa Putri', 4, 'Barang sesuai deskripsi, seller fast response. Texturenya adem di kulit, cocok untuk cuaca Indonesia.'],
    ['Maya Sari', 5, 'Terbaik! Udah coba banyak brand, ini yang paling cocok. Gak bikin breakout dan hasilnya kelihatan cepat.'],
    ['Fitri Handayani', 5, 'Order jam 10 pagi, sorenya udah dikirim. Kualitas produk top, dokumen lengkap. Mantap!'],
    ['Intan Permata', 4, 'Produk bagus, worth it dengan harga segini. Cuma kurang stok soalnya sering habis, hehe.'],
    ['Bella Kirana', 5, 'Sudah langganan di sini. Semua produk original dan fresh stock. Flash sale-nya juga beneran murah!'],
    ['Nadia Rahma', 5, 'Awalnya ragu, ternyata recommended banget. Kulit saya yang sensitif aman dan gak ada reaksi apa-apa.'],
    ['Cindy Kusuma', 4, 'Overall puas. Pengemasan aman, bonus sample juga ada. Terima kasih BeautyLoka!'],
  ]
  let reviewIdx = 0
  const popularProducts = productIds.slice(0, 10)
  for (const p of popularProducts) {
    const n = 2 + (reviewIdx % 2)
    for (let i = 0; i < n; i++) {
      const [author, rating, comment] = reviewTexts[reviewIdx % reviewTexts.length]
      const daysAgo = Math.floor(Math.random() * 30) + 1
      await db.review.create({
        data: {
          productId: p.id,
          author,
          rating,
          comment,
          createdAt: new Date(Date.now() - daysAgo * 86400000),
        },
      })
      reviewIdx++
    }
  }
  console.log(`✓ ${reviewIdx} ulasan`)

  // ====== Banner ======
  const bannerData = [
    {
      title: 'Grand Beauty Sale — Diskon hingga 70%',
      subtitle: 'Promo spesial semua kategori kecantikan favoritmu',
      image: IMG['banner1'][5], sortOrder: 1,
    },
    {
      title: 'Skincare Baru, Kulit Baru',
      subtitle: 'Rutinitas skincare lengkap mulai dari Rp29.000',
      image: IMG['banner2'][1], sortOrder: 2,
    },
    {
      title: 'Flash Sale Setiap Hari',
      subtitle: 'Jam 12.00 WIB — stok terbatas, siapa cepat dia dapat!',
      image: IMG['banner2'][2], sortOrder: 3,
    },
    {
      title: 'Gratis Ongkir Se-Indonesia',
      subtitle: 'Tanpa minimum pembelian khusus pengguna baru',
      image: IMG['banner2'][3], sortOrder: 4,
    },
  ]
  for (const b of bannerData) {
    await db.banner.create({ data: { ...b, isActive: true } })
  }
  console.log(`✓ ${bannerData.length} banner`)

  // ====== Pelanggan ======
  const customerData = [
    { name: 'Dewi Lestari', email: 'dewi.lestari@gmail.com', phone: '0812-3456-7890', address: 'Jl. Kemang Raya No. 12', city: 'Jakarta Selatan', postalCode: '12730' },
    { name: 'Putri Ayu', email: 'putri.ayu@gmail.com', phone: '0813-9876-5432', address: 'Jl. Dago Asri No. 45', city: 'Bandung', postalCode: '40135' },
    { name: 'Sarah Amelia', email: 'sarah.amelia@yahoo.com', phone: '0821-1122-3344', address: 'Jl. Tunjungan No. 8', city: 'Surabaya', postalCode: '60200' },
    { name: 'Rina Marlina', email: 'rina.marlina@gmail.com', phone: '0857-8899-0011', address: 'Jl. Malioboro No. 21', city: 'Yogyakarta', postalCode: '55271' },
    { name: 'Jessica Wong', email: 'jessica.w@gmail.com', phone: '0812-5566-7788', address: 'Jl. Setiabudi No. 99', city: 'Medan', postalCode: '20152' },
    { name: 'Maya Sari', email: 'maya.sari@gmail.com', phone: '0856-1234-9012', address: 'Jl. Sunset Road No. 17', city: 'Denpasar', postalCode: '80361' },
    { name: 'Fitri Handayani', email: 'fitri.h@yahoo.com', phone: '0895-3344-5566', address: 'Jl. Pandanaran No. 30', city: 'Semarang', postalCode: '50241' },
    { name: 'Bella Kirana', email: 'bella.kirana@gmail.com', phone: '0819-7788-1122', address: 'Jl. Ahmad Yani No. 5', city: 'Bekasi', postalCode: '17111' },
  ]
  const customerIds: string[] = []
  for (const c of customerData) {
    const row = await db.customer.create({ data: c })
    customerIds.push(row.id)
  }
  console.log(`✓ ${customerData.length} pelanggan`)

  // ====== Pesanan (18 pesanan dalam 14 hari terakhir) ======
  const payments = ['BCA', 'MANDIRI', 'GOPAY', 'OVO', 'DANA', 'QRIS', 'COD']
  const statusFlow = ['DELIVERED', 'DELIVERED', 'SHIPPED', 'SHIPPED', 'PROCESSED', 'CONFIRMED', 'PENDING', 'PENDING', 'CANCELLED']
  let orderNo = 1000
  let totalOrders = 0

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    // 1-2 pesanan per hari (total ~18)
    const ordersToday = dayOffset % 7 === 3 ? 2 : dayOffset % 3 === 0 ? 1 : dayOffset % 5 === 0 ? 2 : 1
    for (let o = 0; o < ordersToday; o++) {
      const custIdx = (dayOffset + o * 3) % customerIds.length
      const cust = customerData[custIdx]
      const statusIdx = Math.floor((13 - dayOffset) / 1.6) + (o === 1 ? 1 : 0)
      const status = statusFlow[Math.min(statusIdx, statusFlow.length - 1)]

      // 1-3 item per pesanan
      const itemCount = 1 + ((dayOffset + o) % 3 === 0 ? 1 : 0) + ((dayOffset + o) % 4 === 0 ? 1 : 0)
      const chosen = new Set<number>()
      for (let i = 0; i < itemCount; i++) {
        chosen.add((dayOffset * 7 + o * 11 + i * 5) % productIds.length)
      }
      const items = [...chosen].map((pi) => {
        const p = productIds[pi]
        return { ...p, quantity: 1 + ((pi + o) % 2) }
      })

      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
      const shippingCost = subtotal >= 300000 ? 0 : 15000
      const total = subtotal + shippingCost
      const createdAt = new Date(
        Date.now() - dayOffset * 86400000 - o * 3600000 - ((dayOffset * 13 + o * 7) % 8) * 3600000
      )

      const order = await db.order.create({
        data: {
          orderNumber: `BL-202610${String(25 - dayOffset).padStart(2, '0')}-${1000 + totalOrders}`,
          customerId: customerIds[custIdx],
          customerName: cust.name,
          email: cust.email,
          phone: cust.phone,
          address: cust.address,
          city: cust.city,
          postalCode: cust.postalCode,
          subtotal,
          shippingCost,
          total,
          paymentMethod: payments[(dayOffset + o) % payments.length],
          status,
          createdAt,
          items: {
            create: items.map((i) => ({
              productId: i.id,
              name: i.name,
              image: i.image,
              quantity: i.quantity,
              price: i.price,
            })),
          },
        },
      })
      totalOrders++
      void order
    }
  }
  console.log(`✓ ${totalOrders} pesanan`)

  console.log('🎉 Seeding selesai!')
  console.log('   Admin login: admin / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
