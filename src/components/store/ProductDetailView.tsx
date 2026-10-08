 
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronRight,
  Heart,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useCartStore } from '@/store/useCartStore'
import { useSiteStore, getSetting } from '@/store/useSiteStore'
import { formatIDR, formatDateID, discountPercent } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import ProductCard from './ProductCard'
import type { ProductWithReviews, Product, CheckoutConfig } from '@/lib/types'

function StarRating({ rating, size = 'h-4 w-4' }: { rating: number; size?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Rating ${rating} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
          aria-hidden
        />
      ))}
    </span>
  )
}

export default function ProductDetailView({ slug }: { slug: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const addItem = useCartStore((s) => s.addItem)
  const settings = useSiteStore((s) => s.settings)
  const [shipConfig, setShipConfig] = useState<CheckoutConfig | null>(null)

  // Ambil opsi pengiriman dinamis dari server
  useEffect(() => {
    let cancelled = false
    fetch('/api/checkout/config')
      .then(async (res) => {
        if (!res.ok) throw new Error('Gagal memuat konfigurasi')
        return res.json()
      })
      .then((data: CheckoutConfig) => {
        if (!cancelled) setShipConfig(data)
      })
      .catch((e) => console.error(e))
    return () => {
      cancelled = true
    }
  }, [])

  // Teks dinamis dari pengaturan
  const siteName = getSetting<string>(settings, 'site.name', 'BeautyLoka')
  const guaranteeTitle = getSetting<string>(settings, 'product.guaranteeTitle', `Jaminan ${siteName}`)
  const guaranteeTexts = getSetting<string[]>(settings, 'product.guaranteeTexts', [])
  const freeThreshold = getSetting<number>(settings, 'shipping.freeThreshold', 0)
  const { toast } = useToast()

  const [product, setProduct] = useState<ProductWithReviews | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/products/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setProduct(data.product)
        setRelated(data.related)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </main>
    )
  }

  if (notFound || !product) {
    return (
      <main className="container mx-auto flex flex-col items-center px-4 py-24 text-center">
        <p className="text-5xl" aria-hidden>🔍</p>
        <h1 className="mt-4 text-2xl font-bold">Produk tidak ditemukan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Produk mungkin sudah dihapus atau tautannya salah.
        </p>
        <Button onClick={() => navigate({ name: 'products', title: 'Semua Produk' })} className="mt-6 bg-primary hover:bg-primary/90">
          Lihat Semua Produk
        </Button>
      </main>
    )
  }

  const flashPrice = product.isFlashSale ? product.flashPrice : null
  const displayPrice = flashPrice ?? product.price
  const discount = flashPrice
    ? discountPercent(flashPrice, product.price)
    : discountPercent(product.price, product.originalPrice)

  const handleAddToCart = (buyNow = false) => {
    if (product.stock === 0) {
      toast({ title: 'Stok habis', description: 'Produk ini sedang tidak tersedia.', variant: 'destructive' })
      return
    }
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand.name,
        image: product.image,
        price: displayPrice,
        originalPrice: product.originalPrice,
        stock: product.stock,
      },
      quantity
    )
    if (buyNow) {
      navigate({ name: 'cart' })
    } else {
      toast({
        title: 'Ditambahkan ke keranjang ✓',
        description: `${quantity}x ${product.name}`,
      })
    }
  }

  // Distribusi rating untuk visualisasi ulasan
  const ratingDist = [5, 4, 3, 2, 1].map((star) => {
    const count = product.reviews.filter((r) => r.rating === star).length
    return { star, count }
  })

  return (
    <main className="animate-fade-in-up">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <button onClick={() => navigate({ name: 'home' })} className="hover:text-primary">
            Beranda
          </button>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <button
            onClick={() => navigate({ name: 'products', categorySlug: product.category.slug, title: product.category.name })}
            className="hover:text-primary"
          >
            {product.category.name}
          </button>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="line-clamp-1 max-w-40 text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Galeri */}
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl border bg-neutral-50">
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              {discount > 0 && (
                <span className="absolute top-4 left-4 rounded-lg bg-primary px-2.5 py-1 text-sm font-bold text-white shadow">
                  -{discount}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[product.image, product.image, product.image, product.image].map((img, i) => (
                <div
                  key={i}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${i === 0 ? 'border-primary' : 'border-transparent opacity-60'} bg-neutral-50`}
                >
                  <img src={img} alt={`${product.name} - gambar ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <button
              onClick={() => navigate({ name: 'products', brandSlug: product.brand.slug, title: product.brand.name })}
              className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
            >
              {product.brand.name}
            </button>
            <h1 className="mt-1 text-xl font-bold leading-snug md:text-2xl">{product.name}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <StarRating rating={product.rating} />
              <span className="font-semibold">{product.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({product.reviewCount} ulasan)
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {product.sold > 999 ? `${(product.sold / 1000).toFixed(1)}rb` : product.sold} terjual
              </span>
            </div>

            {/* Harga */}
            <div className="mt-4 rounded-xl bg-secondary/60 p-4">
              {product.originalPrice && product.originalPrice > displayPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  {formatIDR(product.originalPrice)}
                </p>
              )}
              <div className="flex flex-wrap items-baseline gap-2">
                <p className={`text-3xl font-bold ${flashPrice ? 'text-primary' : ''}`}>
                  {formatIDR(displayPrice)}
                </p>
                {flashPrice && (
                  <Badge className="gap-1 bg-primary hover:bg-primary">
                    <Zap className="h-3 w-3 fill-white" /> Flash Sale
                  </Badge>
                )}
              </div>
              {flashPrice && (
                <div className="mt-3">
                  <div className="h-2 w-full max-w-56 overflow-hidden rounded-full bg-amber-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-primary"
                      style={{
                        width: `${Math.min(100, Math.round(((product.flashSold || 0) / ((product.flashSold || 0) + (product.flashStock || 1))) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-primary">
                    {product.flashSold || 0} terjual • sisa {Math.max(0, (product.flashStock || product.stock) - (product.flashSold || 0))} stok promo
                  </p>
                </div>
              )}
            </div>

            {/* Stok & qty */}
            <div className="mt-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Jumlah</p>
                <p className="text-xs text-muted-foreground">
                  {product.stock > 0 ? `Sisa stok ${product.stock}` : 'Stok habis'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Kurangi jumlah"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  aria-label="Tambah jumlah"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-primary/40 text-primary hover:bg-primary hover:text-white"
                onClick={() => handleAddToCart(false)}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-4 w-4" /> Tambah ke Tas
              </Button>
              <Button
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90"
                onClick={() => handleAddToCart(true)}
                disabled={product.stock === 0}
              >
                <Zap className="h-4 w-4" /> Beli Sekarang
              </Button>
            </div>

            {/* Jaminan */}
            <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border p-3 text-center">
              <div className="flex flex-col items-center gap-1 py-1">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
                <p className="text-[11px] font-semibold">100% Original</p>
              </div>
              <div className="flex flex-col items-center gap-1 border-x py-1">
                <Truck className="h-5 w-5 text-primary" aria-hidden />
                <p className="text-[11px] font-semibold">Gratis Ongkir</p>
              </div>
              <div className="flex flex-col items-center gap-1 py-1">
                <RotateCcw className="h-5 w-5 text-primary" aria-hidden />
                <p className="text-[11px] font-semibold">Garansi 30 Hari</p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Heart className="h-4 w-4" /> Simpan ke Wishlist
              </Button>
            </div>
          </div>
        </div>

        {/* Deskripsi & Ulasan */}
        <Tabs defaultValue="description" className="mt-10">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted p-1 no-scrollbar">
            <TabsTrigger value="description" className="px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary">
              Detail Produk
            </TabsTrigger>
            <TabsTrigger value="reviews" className="px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary">
              Ulasan ({product.reviews.length})
            </TabsTrigger>
            <TabsTrigger value="shipping" className="px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary">
              Pengiriman & Garansi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-4 rounded-xl border bg-white p-5">
            <h2 className="mb-3 font-bold">Deskripsi Produk</h2>
            <p className="whitespace-pre-line leading-relaxed text-neutral-700">{product.description}</p>
            <Accordion type="single" collapsible className="mt-6">
              <AccordionItem value="cara-pakai">
                <AccordionTrigger className="text-sm font-semibold">Cara Pakai</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-neutral-600">
                  Bersihkan wajah terlebih dahulu, lalu ambil produk secukupnya. Aplikasikan merata
                  pada area yang dituju sambil dipijat lembut. Gunakan secara rutin pagi dan/atau
                  malam untuk hasil optimal. Untuk produk aktif tertentu, gunakan sunscreen di
                  siang hari.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="varian">
                <AccordionTrigger className="text-sm font-semibold">Informasi Varian</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-neutral-600">
                  Kategori: {product.category.name} • Brand: {product.brand.name} • Produk ini
                  100% original dan didistribusikan resmi di {siteName}. Segel dan batch code
                  terjamin keasliannya.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 rounded-xl border bg-white p-5">
            {product.reviews.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl" aria-hidden>💬</p>
                <p className="mt-3 font-semibold">Belum ada ulasan</p>
                <p className="text-sm text-muted-foreground">Jadilah yang pertama mengulas produk ini!</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="flex flex-col items-center rounded-xl bg-secondary/60 px-8 py-5">
                    <p className="text-4xl font-bold">{product.rating.toFixed(1)}</p>
                    <StarRating rating={product.rating} size="h-3.5 w-3.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{product.reviewCount} ulasan</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {ratingDist.map(({ star, count }) => (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-6 text-right font-semibold">{star}★</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{
                              width: `${product.reviews.length ? (count / product.reviews.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="w-6 text-muted-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 divide-y">
                  {product.reviews.map((review) => (
                    <article key={review.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                            {review.author.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{review.author}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateID(review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size="h-3 w-3" />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{review.comment}</p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="shipping" className="mt-4 rounded-xl border bg-white p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Truck className="h-4 w-4 text-primary" /> Opsi Pengiriman
                </div>
                <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
                  {/* Tarif ongkir langsung dari database (dikelola admin) */}
                  {(shipConfig?.shippingMethods || []).map((m) => (
                    <li key={m.code}>• {m.label} ({m.eta}) — {formatIDR(m.cost)}</li>
                  ))}
                  {freeThreshold > 0 && (
                    <li className="font-semibold text-primary">
                      • GRATIS ongkir min. belanja {formatIDR(freeThreshold)}
                    </li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" /> {guaranteeTitle}
                </div>
                <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
                  {guaranteeTexts.map((text) => (
                    <li key={text}>• {text}</li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Produk terkait */}
        {related.length > 0 && (
          <section className="mt-12" aria-label="Produk serupa">
            <h2 className="mb-4 text-lg font-bold md:text-xl">Produk Serupa</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {related.slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
