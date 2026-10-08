'use client'

import { useAppStore } from '@/store/useAppStore'
import { useSiteStore, getSetting } from '@/store/useSiteStore'
import { Sparkles, Instagram, Facebook, Youtube, Twitter, Mail, Phone, MapPin, Globe } from 'lucide-react'
import type { Category } from '@/lib/types'

interface TrustBadge {
  icon: string
  title: string
  desc: string
}

interface SocialLink {
  platform: string
  url: string
}

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  Instagram,
  Facebook,
  Youtube,
  Twitter,
}

interface FooterProps {
  categories: Category[]
}

export default function Footer({ categories }: FooterProps) {
  const navigate = useAppStore((s) => s.navigate)
  const settings = useSiteStore((s) => s.settings)

  // ===== Konten footer dinamis dari pengaturan =====
  const siteName = getSetting<string>(settings, 'site.name', 'BeautyLoka')
  const about = getSetting<string>(settings, 'footer.about', '')
  const copyright = getSetting<string>(settings, 'footer.copyright', `© ${new Date().getFullYear()} ${siteName}`)
  const email = getSetting<string>(settings, 'footer.email', '')
  const phone = getSetting<string>(settings, 'footer.phone', '')
  const address = getSetting<string>(settings, 'footer.address', '')
  const trustBadges = getSetting<TrustBadge[]>(settings, 'footer.trustBadges', [])
  const paymentBadges = getSetting<string[]>(settings, 'footer.paymentBadges', [])
  const courierBadges = getSetting<string[]>(settings, 'footer.courierBadges', [])
  const socials = getSetting<SocialLink[]>(settings, 'footer.socials', [])

  const nameParts = siteName.includes(' ')
    ? [siteName.slice(0, siteName.indexOf(' ')), siteName.slice(siteName.indexOf(' ') + 1)]
    : [siteName, '']

  return (
    <footer className="mt-auto border-t border-neutral-100 bg-white">
      {/* Trust badges (dari pengaturan) */}
      {trustBadges.length > 0 && (
        <div className="border-b border-neutral-100 bg-secondary/40">
          <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
            {trustBadges.map((badge) => (
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
      )}

      {/* Main footer */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <button
              onClick={() => navigate({ name: 'home' })}
              className="flex items-center gap-1.5"
              aria-label={siteName}
            >
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl tracking-tight">
                {nameParts[0]}
                {nameParts[1] && <span className="text-primary">{nameParts[1]}</span>}
              </span>
            </button>
            {about && <p className="mt-3 text-sm text-muted-foreground">{about}</p>}
            {socials.length > 0 && (
              <div className="mt-4 flex gap-2">
                {socials.map((social) => {
                  const Icon = SOCIAL_ICONS[social.platform] || Globe
                  return (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-white"
                      aria-label={social.platform}
                      title={social.platform}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  )
                })}
              </div>
            )}
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
          {paymentBadges.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Metode Pembayaran</h3>
              <div className="flex flex-wrap gap-1.5">
                {paymentBadges.map((pm) => (
                  <span
                    key={pm}
                    className="rounded border border-neutral-200 bg-white px-2 py-1 text-[10px] font-semibold text-neutral-600"
                  >
                    {pm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pengiriman & kontak */}
          <div>
            {courierBadges.length > 0 && (
              <>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Jasa Pengiriman</h3>
                <div className="flex flex-wrap gap-1.5">
                  {courierBadges.map((c) => (
                    <span
                      key={c}
                      className="rounded border border-neutral-200 bg-white px-2 py-1 text-[10px] font-semibold text-neutral-600"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </>
            )}
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              {email && (
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> {email}
                </p>
              )}
              {phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {phone}
                </p>
              )}
              {address && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> {address}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-100">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>{copyright}</p>
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
