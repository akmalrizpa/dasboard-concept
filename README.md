# 💄 BeautyLoka — Webstore & Admin Dashboard

**BeautyLoka** adalah aplikasi e-commerce kecantikan full-stack terinspirasi [Sociolla](https://www.sociolla.com/), terdiri dari **storefront pelanggan** dan **admin dashboard** dalam satu aplikasi.

Dibuat **100% dinamis**: seluruh konten — produk, harga & promo, voucher, jendela flash sale, ongkir, metode pembayaran, teks promosi, artikel, hingga footer — disimpan di database dan dapat diubah dari dashboard admin **tanpa menyentuh source code sama sekali**.

![Storefront](scripts/img/final_home.png)

## ✨ Fitur Utama

### 🛍️ Storefront (Toko Online)
- **Beranda dinamis** — hero banner carousel, marquee promo, grid kategori, flash sale + countdown, brand populer, rekomendasi produk, dan artikel; semuanya dibaca dari database.
- **Katalog produk** — filter per kategori & brand, pencarian, pengurutan (terbaru, termurah, termahal, terlaris), halaman khusus flash sale.
- **Detail produk** — galeri, tab deskripsi/kegunaan, ulasan & rating, pengaturan jumlah, produk terkait.
- **Keranjang** — minimum pembelian, info ongkir, dan info voucher berlaku.
- **Checkout 4 langkah** — data diri → pengiriman (dari DB) → pembayaran + biaya layanan (dari DB) → ringkasan; validasi voucher secara real-time.
- **Halaman sukses** — instruksi pembayaran otomatis sesuai metode yang dipilih (dari DB).
- **Lacak pesanan** berdasarkan kode pemesanan.
- Responsive mobile-first (grid 2 kolom di layar kecil).

![Admin Dashboard](scripts/img/check_admin_dash.png)

### 📊 Admin Dashboard
- **Login aman** — token sesi HMAC-SHA256, semua endpoint admin terproteksi `Authorization: Bearer <token>`.
- **Ringkasan** — 4 kartu statistik, grafik area/pie/bar (Recharts), produk terlaris, stok menipis, pesanan terbaru.
- **Katalog** — CRUD produk (harga normal + harga promo, stok, stok flash sale), kategori, dan brand.
- **Pesanan & Pelanggan** — daftar pesanan, ubah status pesanan, data pelanggan.
- **Voucher & Promo** — CRUD voucher + jendela Flash Sale (mulai/berakhir, produk, stok).
- **Pengaturan** (6 tab) — Umum, Beranda & Flash Sale, Pengiriman, Pembayaran, Produk & Artikel, Footer & Kontak.
- Setiap perubahan tersimpan **langsung tampil di storefront** — tanpa restart, tanpa ubah kode.

## 🧱 Teknologi

| Teknologi | Peran |
|---|---|
| [Next.js 16](https://nextjs.org) (App Router) | Framework full-stack React |
| React 19 + TypeScript | UI & type safety |
| Tailwind CSS 4 | Styling |
| shadcn/ui + Radix UI | Komponen antarmuka |
| Prisma ORM + SQLite | Database (`db/custom.db`) |
| Zustand | State management |
| Recharts | Grafik dashboard admin |
| date-fns | Format tanggal & countdown |

## 📁 Struktur Proyek

```
├── db/custom.db              # Database SQLite (sudah terisi data contoh)
├── prisma/schema.prisma      # Skema 15 model
├── scripts/
│   ├── seed.ts               # Seed data inti (admin, produk, pesanan, …)
│   ├── seed_dynamic.ts       # Seed konfigurasi dinamis (settings, voucher, …)
│   └── img/                  # Kumpulan URL gambar untuk seed
├── src/
│   ├── app/
│   │   ├── page.tsx          # Entry SPA (storefront + admin)
│   │   └── api/              # API routes (publik + admin)
│   ├── components/
│   │   ├── store/            # Komponen storefront
│   │   ├── admin/            # Komponen admin dashboard
│   │   └── ui/               # Primitif shadcn/ui
│   ├── lib/                  # db, auth (HMAC), settings, format
│   ├── store/                # Zustand stores (app, cart, site, admin)
│   └── hooks/
├── .env.example              # Template environment
└── package.json
```

## 🚀 Mulai Cepat

**Prasyarat:** Node.js ≥ 20 (disarankan 24), npm. Opsional: Bun ≥ 1.3.

```bash
# 1. Clone
git clone https://github.com/akmalrizpa/dasboard-concept.git
cd dasboard-concept

# 2. Siapkan environment
cp .env.example .env

# 3. Install dependency & generate Prisma Client
npm install
npx prisma generate

# 4. Jalankan
npm run dev
```

Buka **http://localhost:3000** — database sudah terisi data contoh (32 produk, promo, voucher, pengaturan), jadi aplikasi langsung bisa dipakai.

### 🔐 Login Admin

Klik ikon akun di pojok kanan atas header → **Admin**, lalu masuk dengan:

| Kolom | Nilai |
|---|---|
| Username | `admin` |
| Password | `admin123` |

> ⚠️ **Segera ganti password ini** melalui dashboard sebelum dipakai lebih lanjut.

### 🔄 Menyiapkan Ulang Database (opsional)

```bash
npm run db:push                   # sinkronkan skema ke database
npx tsx scripts/seed.ts           # seed data inti
npx tsx scripts/seed_dynamic.ts   # seed konfigurasi dinamis
```

Bisa juga memakai Bun: `bun run scripts/seed.ts`.

## 🗄️ Basis Data

15 model Prisma — seluruhnya bisa dikelola dari dashboard:

| Model | Isi (data contoh) |
|---|---|
| `Admin` | Akun login dashboard (1) |
| `Category` | 6 kategori (Skincare, Make Up, …) |
| `Brand` | 12 brand |
| `Product` | 32 produk + harga promo + stok flash sale |
| `Review` | 20 ulasan & rating |
| `Customer` | 8 pelanggan |
| `Order` + `OrderItem` | 17 pesanan |
| `Banner` | Hero carousel beranda |
| `SiteSetting` | 31 pengaturan key-value (nama toko, marquee, ongkir, footer, …) |
| `FlashSale` | Jendela waktu flash sale (mulai/berakhir) |
| `ShippingMethod` | 3 metode pengiriman + tarif |
| `PaymentMethod` | 8 metode pembayaran + biaya layanan |
| `Voucher` | Aturan diskon (kuota, minimum, periode) |
| `Article` | Artikel di beranda |

## 🔌 API

### Publik

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/home` | Beranda (banner, kategori, flash sale, rekomendasi, settings, artikel) |
| `GET` | `/api/products` | Katalog — query: `category`, `brand`, `q`, `sort`, `flash` |
| `GET` | `/api/products/[slug]` | Detail produk + ulasan + produk terkait |
| `GET` | `/api/checkout/config` | Ongkir, pembayaran, dan pengaturan checkout |
| `POST` | `/api/vouchers/validate` | Validasi & hitung diskon voucher |
| `POST` | `/api/checkout` | Buat pesanan (harga dihitung ulang di server) |
| `POST` | `/api/orders/track` | Lacak pesanan berdasarkan kode |

### Admin (butuh token)

Semua endpoint di bawah membutuhkan header `Authorization: Bearer <token>`.

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/api/admin/login` | Login, mengembalikan token |
| `GET` | `/api/admin/stats` | Statistik dashboard |
| `GET`/`PUT` | `/api/admin/settings` | Baca/simpan pengaturan situs |
| `GET/POST/PUT/DELETE` | `/api/admin/flash-sale` | Jendela flash sale |
| CRUD | `/api/admin/products` `orders` `customers` `categories` `brands` `shipping` `payments` `vouchers` `articles` | Manajemen data |

Contoh login:

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## ⚙️ Ubah Konten Tanpa Sentuh Kode

Semua hal di bawah ini dikelola dari dashboard admin dan langsung berlaku di storefront:

| Aspek | Lokasi di dashboard |
|---|---|
| Nama toko, marquee promo, placeholder pencarian | Pengaturan → Umum |
| Judul section beranda & jendela flash sale | Pengaturan → Beranda & Flash Sale |
| Produk, harga, harga promo, stok | Katalog → Produk |
| Voucher (diskon, minimum belanja, kuota, periode) | Voucher & Promo |
| Metode pengiriman & tarif ongkir | Pengaturan → Pengiriman |
| Metode pembayaran & biaya layanan | Pengaturan → Pembayaran |
| Artikel, footer, kontak, sosmed | Pengaturan → Footer & Kontak |

**Aturan voucher** yang didukung:

| Tipe | Makna `value` | Tambahan |
|---|---|---|
| `PERCENT` | Persen diskon (mis. `10` = 10%) | `maxDiscount` membatasi nominal |
| `FIXED` | Potongan tetap dalam Rupiah | — |
| `FREE_SHIPPING` | Gratis ongkir | — |

Semua voucher dapat dibatasi `minPurchase`, `usageLimit`, dan periode aktif.

> 🧮 **Keamanan harga:** total tagihan di `/api/checkout` **selalu dihitung ulang dari database** (ongkir, diskon voucher, biaya pembayaran) — klien tidak dapat memanipulasi angka.

## 🛡️ Keamanan

1. **Ganti password admin default** (`admin/admin123`) segera setelah clone.
2. Untuk produksi, isi `ADMIN_TOKEN_SECRET` di `.env` dengan string acak yang panjang.
3. `.env` tidak dibawa ke repo (sudah di-gitignore) — jangan pernah commit kredensial.

## 📦 Build Produksi

```bash
npm run build     # build + siapkan standalone
npm start         # jalankan server (memakai Bun)
```

## 📝 Catatan

- Gambar produk memakai URL eksternal yang tersimpan di database; kumpulan URL-nya ada di `scripts/img/all_urls.json` — sehingga seed bisa dijalankan ulang tanpa jaringan.
- Proyek ini dibuat untuk keperluan demo/pembelajaran. Untuk produksi sungguhan, pertimbangkan: payment gateway asli, autentikasi pelanggan, dan migrasi dari SQLite ke PostgreSQL.
