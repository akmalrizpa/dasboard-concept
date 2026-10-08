'use client'

import { useAppStore } from '@/store/useAppStore'
import { Sparkles, Instagram, Facebook, Youtube, Twitter, Mail, Phone, MapPin } from 'lucide-react'
import type { Category } from '@/lib/types'

const PAYMENT_METHODS = ['BCA', 'Mandiri', 'BNI', 'GoPay', 'OVO', 'DANA', 'QRIS', 'COD']
const COURIERS = ['JNE', 'J&T Express', 'SiCepat', 'AnterAja', 'GoSend', 'GrabExpress']

interface FooterProps {
  categories: Category[]
}

export default function Footer({ categories }: FooterProps) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <footer className="mt-auto border-t border-neutral-100 bg-white">
      {/* Trust badges */}
      <div className="border-b border-neutral-100 bg-secondary/40">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
          {[
            { icon: '🛡️', title: '100% Original', desc: 'Produk bergaransi resmi' },
            { icon: '🚚', title: 'Gratis Ongkir', desc: 'Min. belanja Rp300rb' },
            { icon: '💳', title: 'Pembayaran Aman', desc: 'Beragam metode bayar' },
            { icon: '↩️', title: 'Garansi 30 Hari', desc: 'Uang kembali 100%' },
          ].map((badge) => (
            <div key={badge.title} className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {badge.icon}
              </span>
              <div>
                <p className="text-sm font-semibold">{badge.title}</p>
                <p className="text-xs text-muted-foreground">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <button
              onClick={() => navigate({ name: 'home' })}
              className="flex items-center gap-1.5"
              aria-label="BeautyLoka"
            >
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl tracking-tight">
                Beauty<span className="text-primary">Loka</span>
              </span>
            </button>
            <p className="mt-3 text-sm text-muted-foreground">
              Destinasi kecantikan nomor 1 di Indonesia. Temukan produk skincare, makeup, dan
              perawatan diri 100% original dengan harga terbaik.
            </p>
            <div className="mt-4 flex gap-2">
              {[Instagram, Facebook, Youtube, Twitter].map((Icon, i) => (
                <button
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-white"
                  aria-label="Media sosial"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Kategori */}
          <nav aria-label="Kategori footer">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Kategori</h3>
            <ul className="space-y-2">
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => navigate({ name: 'products', categorySlug: c.slug, title: c.name })}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bantuan */}
          <nav aria-label="Bantuan">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Bantuan</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button className="transition-colors hover:text-primary">Cara Belanja</button>
              </li>
              <li>
                <button className="transition-colors hover:text-primary">Metode Pembayaran</button>
              </li>
              <li>
                <button
                  className="transition-colors hover:text-primary"
                  onClick={() => navigate({ name: 'track' })}
                >
                  Lacak Pesanan
                </button>
              </li>
              <li>
                <button className="transition-colors hover:text-primary">Pengembalian Barang</button>
              </li>
              <li>
                <button className="transition-colors hover:text-primary">Syarat & Ketentuan</button>
              </li>
              <li>
                <button className="transition-colors hover:text-primary">Kebijakan Privasi</button>
              </li>
            </ul>
          </nav>

          {/* Pembayaran */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Metode Pembayaran</h3>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((pm) => (
                <span
                  key={pm}
                  className="rounded border border-neutral-200 bg-white px-2 py-1 text-[10px] font-semibold text-neutral-600"
                >
                  {pm}
                </span>
              ))}
            </div>
          </div>

          {/* Pengiriman */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Jasa Pengiriman</h3>
            <div className="flex flex-wrap gap-1.5">
              {COURIERS.map((c) => (
                <span
                  key={c}
                  className="rounded border border-neutral-200 bg-white px-2 py-1 text-[10px] font-semibold text-neutral-600"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> halo@beautyloka.id
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> (021) 555-0123
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Jakarta Selatan, Indonesia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-100">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 BeautyLoka. Seluruh hak cipta dilindungi.</p>
          <button
            onClick={() => navigate({ name: 'admin-login' })}
            className="transition-colors hover:text-primary"
          >
            Dasbor Admin
          </button>
        </div>
      </div>
    </footer>
  )
}
