 
'use client'

import { useEffect, useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import { useAppStore } from '@/store/useAppStore'
import { useSiteStore, getSetting } from '@/store/useSiteStore'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Zap, ArrowRight, Timer } from 'lucide-react'
import type { HomeData, Product } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Countdown flash sale — mengikuti waktu selesai yang diatur admin */
function useFlashCountdown(endIso?: string | null) {
  const [remaining, setRemaining] = useState({ h: 0, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      // Fallback: tengah malam ini jika jendela tidak tersedia
      const now = new Date()
      const end = endIso ? new Date(endIso) : new Date(now)
      if (!endIso) end.setHours(23, 59, 59, 999)
      const diff = Math.max(0, end.getTime() - now.getTime())
      setRemaining({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endIso])
  return remaining
}

function SectionHeader({
  title,
  emoji,
  actionLabel,
  onAction,
}: {
  title: string
  emoji?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-bold md:text-2xl">
        {emoji && (
          <span aria-hidden className="text-xl md:text-2xl">
            {emoji}
          </span>
        )}
        {title}
      </h2>
      {actionLabel && onAction && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAction}
          className="gap-1 text-primary hover:text-primary/80"
        >
          {actionLabel} <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default function HomePage({ data, loading }: { data: HomeData | null; loading: boolean }) {
  const navigate = useAppStore((s) => s.navigate)
  const settings = useSiteStore((s) => s.settings)
  const flashWindow = useSiteStore((s) => s.flashWindow)
  const articles = useSiteStore((s) => s.articles)
  const countdown = useFlashCountdown(flashWindow?.endsAt)
  const [bannerIndex, setBannerIndex] = useState(0)
  const [recommendTab, setRecommendTab] = useState<'bestseller' | 'newest'>('bestseller')

  // ===== Judul section dinamis dari pengaturan =====
  const categoryTitle = getSetting<string>(settings, 'section.categoryTitle', 'Kategori Populer')
  const categoryEmoji = getSetting<string>(settings, 'section.categoryEmoji', '🧴')
  const brandTitle = getSetting<string>(settings, 'section.brandTitle', 'Brand Unggulan')
  const brandEmoji = getSetting<string>(settings, 'section.brandEmoji', '💎')
  const recommendTitle = getSetting<string>(settings, 'section.recommendTitle', 'Rekomendasi Untukmu')
  const recommendEmoji = getSetting<string>(settings, 'section.recommendEmoji', '✨')
  const journalTitle = getSetting<string>(settings, 'section.journalTitle', 'Beauty Journal')
  const journalEmoji = getSetting<string>(settings, 'section.journalEmoji', '📖')
  const flashTitle = flashWindow?.title || 'Flash Sale'

  const banners = data?.banners || []
  const recommendProducts: Product[] = useMemo(() => {
    if (!data) return []
    return recommendTab === 'bestseller' ? data.bestSellers : data.newest
  }, [data, recommendTab])

  // Auto-slide banner
  useEffect(() => {
    if (banners.length <= 1) return
    const id = setInterval(() => setBannerIndex((i) => (i + 1) % banners.length), 5000)
    return () => clearInterval(id)
  }, [banners.length])

  if (loading || !data) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-6">
        <Skeleton className="aspect-[21/8] w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <main className="animate-fade-in-up">
      {/* Hero carousel */}
      {banners.length > 0 && (
        <section className="container mx-auto px-4 pt-4" aria-label="Promo unggulan">
          <div className="relative overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
            >
              {banners.map((banner, i) => (
                <button
                  key={banner.id}
                  onClick={() => navigate({ name: 'products', flash: true, title: 'Promo Spesial' })}
                  className="relative aspect-[21/9] w-full shrink-0 sm:aspect-[21/7] lg:aspect-[21/6]"
                  aria-label={`${banner.title} — lihat promo`}
                >
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent sm:from-black/50 sm:via-transparent" />
                  <div className="absolute bottom-0 left-0 p-5 text-left sm:p-10">
                    <h2 className="max-w-md text-xl font-bold leading-tight text-white drop-shadow sm:text-3xl lg:text-4xl">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="mt-1 max-w-sm text-xs text-white/90 sm:text-base">
                        {banner.subtitle}
                      </p>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-neutral-900 transition-transform hover:scale-105 sm:text-sm">
                      Belanja Sekarang <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {banners.length > 1 && (
              <>
                <button
                  onClick={() => setBannerIndex((bannerIndex - 1 + banners.length) % banners.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow backdrop-blur transition hover:bg-white"
                  aria-label="Banner sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setBannerIndex((bannerIndex + 1) % banners.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow backdrop-blur transition hover:bg-white"
                  aria-label="Banner berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setBannerIndex(i)}
                      aria-label={`Ke banner ${i + 1}`}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === bannerIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Kategori */}
      <section className="container mx-auto px-4 pt-8" aria-label={categoryTitle}>
        <SectionHeader title={categoryTitle} emoji={categoryEmoji} />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {data.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate({ name: 'products', categorySlug: cat.slug, title: cat.name })}
              className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-secondary text-2xl transition-transform group-hover:scale-110 md:h-16 md:w-16">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span aria-hidden>{cat.icon || '✨'}</span>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold leading-tight md:text-sm">{cat.name}</p>
                <p className="text-[10px] text-muted-foreground">{cat.productCount} produk</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Flash sale — tampil hanya jika jendela aktif & ada produk */}
      {flashWindow && data.flashSale.length > 0 && (
        <section className="mt-10 bg-gradient-to-r from-primary/10 via-rose-50 to-primary/10 py-8" aria-label={flashTitle}>
          <div className="container mx-auto px-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold md:text-2xl">
                  <Zap className="h-6 w-6 fill-amber-400 text-amber-400" aria-hidden />
                  {flashTitle}
                </h2>
                <div className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 text-white">
                  <Timer className="h-3.5 w-3.5 animate-pulse-dot" aria-hidden />
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {String(countdown.h).padStart(2, '0')}:
                    {String(countdown.m).padStart(2, '0')}:
                    {String(countdown.s).padStart(2, '0')}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ name: 'products', flash: true, title: flashTitle })}
                className="gap-1 rounded-full border-primary/30 text-primary hover:bg-primary hover:text-white"
              >
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex snap-x gap-4 overflow-x-auto pb-2 custom-scrollbar" role="list">
              {data.flashSale.map((product) => {
                const stock = product.flashStock || product.stock
                const sold = product.flashSold || 0
                const progress = stock + sold > 0 ? Math.min(100, Math.round((sold / (stock + sold)) * 100)) : 0
                return (
                  <div key={product.id} className="w-40 shrink-0 snap-start md:w-48" role="listitem">
                    <ProductCard product={product} />
                    <div className="mt-1.5 px-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-primary"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-center text-[10px] font-semibold text-primary">
                        {sold > 0 ? `${sold} terjual` : 'Segera habis!'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Brand unggulan */}
      {data.brands.length > 0 && (
        <section className="container mx-auto px-4 pt-10" aria-label={brandTitle}>
          <SectionHeader title={brandTitle} emoji={brandEmoji} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
            {data.brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => navigate({ name: 'products', brandSlug: brand.slug, title: brand.name })}
                className="flex h-20 items-center justify-center rounded-xl border border-neutral-100 bg-white px-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="text-center">
                  <p className="text-sm font-bold tracking-tight text-neutral-800 md:text-base">
                    {brand.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{brand.productCount} produk</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Rekomendasi */}
      <section className="container mx-auto px-4 py-10" aria-label={recommendTitle}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold md:text-2xl">{recommendEmoji} {recommendTitle}</h2>
          <div className="flex rounded-full bg-neutral-100 p-1">
            <button
              onClick={() => setRecommendTab('bestseller')}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-all md:text-sm',
                recommendTab === 'bestseller' ? 'bg-white shadow text-primary' : 'text-neutral-500'
              )}
            >
              Terlaris
            </button>
            <button
              onClick={() => setRecommendTab('newest')}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-all md:text-sm',
                recommendTab === 'newest' ? 'bg-white shadow text-primary' : 'text-neutral-500'
              )}
            >
              Terbaru
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {recommendProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => navigate({ name: 'products', title: 'Semua Produk' })}
            className="rounded-full bg-primary px-8 hover:bg-primary/90"
          >
            Lihat Semua Produk <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Beauty journal — disembunyikan sementara (mobile & desktop) supaya tampilan beda dari referensi.
          Untuk mengaktifkan lagi: hapus tanda komentar pada blok di bawah. */}
      {/* {articles.length > 0 && (
        <section className="border-t border-neutral-100 bg-secondary/30 py-10" aria-label={journalTitle}>
          <div className="container mx-auto px-4">
            <SectionHeader title={journalTitle} emoji={journalEmoji} />
            <div className="grid gap-4 md:grid-cols-3">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="cursor-pointer rounded-xl border border-neutral-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-3xl" aria-hidden>
                    {article.emoji}
                  </span>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-primary">
                    {article.tag}
                  </p>
                  <h3 className="mt-1 line-clamp-2 font-bold leading-snug">{article.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )} */}
    </main>
  )
}
