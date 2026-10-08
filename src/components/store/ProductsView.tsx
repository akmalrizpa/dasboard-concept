'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ProductCard from './ProductCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SlidersHorizontal, X, Search, PackageSearch, Star } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { Product, Category, Brand } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Filters {
  categorySlug: string
  brandSlugs: string[]
  maxPrice: number
  minRating: number
  discountedOnly: boolean
  sort: string
  q: string
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'bestseller', label: 'Terlaris' },
  { value: 'price-asc', label: 'Harga Terendah' },
  { value: 'price-desc', label: 'Harga Tertinggi' },
  { value: 'rating', label: 'Rating Tertinggi' },
]

export default function ProductsView({
  categories,
  brands,
}: {
  categories: Category[]
  brands: Brand[]
}) {
  const view = useAppStore((s) => s.view)
  const navigate = useAppStore((s) => s.navigate)
  const v = view.name === 'products' ? view : { name: 'products' as const }

  const [filters, setFilters] = useState<Filters>({
    categorySlug: v.categorySlug || '',
    brandSlugs: v.brandSlug ? [v.brandSlug] : [],
    maxPrice: 500000,
    minRating: 0,
    discountedOnly: false,
    sort: 'newest',
    q: v.query || '',
  })
  const [searchInput, setSearchInput] = useState(v.query || '')
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const perPage = 24
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sinkronkan perubahan navigasi (mis. klik kategori dari header)
  useEffect(() => {
    if (view.name === 'products') {
      setFilters((f) => ({
        ...f,
        categorySlug: view.categorySlug || '',
        brandSlugs: view.brandSlug ? [view.brandSlug] : f.brandSlugs,
        q: view.query || '',
        ...(view.flash ? { discountedOnly: false } : {}),
      }))
      setSearchInput(view.query || '')
      setPage(1)
    }
  }, [view])

  const flashOnly = view.name === 'products' && view.flash

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        sort: filters.sort,
      })
      if (filters.categorySlug) params.set('category', filters.categorySlug)
      if (filters.brandSlugs.length) params.set('brand', filters.brandSlugs.join(','))
      if (filters.q) params.set('q', filters.q)
      if (filters.maxPrice < 500000) params.set('maxPrice', String(filters.maxPrice))
      if (filters.minRating > 0) params.set('minRating', String(filters.minRating))
      if (filters.discountedOnly) params.set('discounted', 'true')
      if (flashOnly) params.set('flash', 'true')

      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setProducts(data.products)
        setTotal(data.total)
      }
    } catch (e) {
      console.error('Gagal memuat produk', e)
    } finally {
      setLoading(false)
    }
  }, [filters, page, flashOnly])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchProducts, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchProducts])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.categorySlug) n++
    if (filters.brandSlugs.length) n++
    if (filters.maxPrice < 500000) n++
    if (filters.minRating > 0) n++
    if (filters.discountedOnly) n++
    return n
  }, [filters])

  const updateFilter = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  const toggleBrand = (slug: string) => {
    updateFilter({
      brandSlugs: filters.brandSlugs.includes(slug)
        ? filters.brandSlugs.filter((b) => b !== slug)
        : [...filters.brandSlugs, slug],
    })
  }

  const resetFilters = () => {
    updateFilter({
      categorySlug: '',
      brandSlugs: [],
      maxPrice: 500000,
      minRating: 0,
      discountedOnly: false,
    })
  }

  const title =
    v.title ||
    (flashOnly
      ? 'Flash Sale'
      : filters.q
        ? `Hasil pencarian "${filters.q}"`
        : filters.categorySlug
          ? categories.find((c) => c.slug === filters.categorySlug)?.name || 'Produk'
          : 'Semua Produk')

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const FilterPanel = (
    <div className="space-y-6">
      {/* Kategori */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Kategori</h3>
        <RadioGroup
          value={filters.categorySlug}
          onValueChange={(val) => updateFilter({ categorySlug: val })}
          className="gap-2"
        >
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <RadioGroupItem value="" id="cat-all" />
            Semua Kategori
          </label>
          {categories.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <RadioGroupItem value={c.slug} id={`cat-${c.slug}`} />
              <span aria-hidden>{c.icon}</span> {c.name}
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Brand */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Brand</h3>
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
          {brands.map((b) => (
            <label
              key={b.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={filters.brandSlugs.includes(b.slug)}
                onCheckedChange={() => toggleBrand(b.slug)}
                aria-label={`Filter brand ${b.name}`}
              />
              {b.name}
              <span className="ml-auto text-xs text-muted-foreground">{b.productCount}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Harga */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Harga Maksimum</h3>
        <Slider
          value={[filters.maxPrice]}
          onValueChange={([val]) => setFilters((f) => ({ ...f, maxPrice: val }))}
          onValueCommit={([val]) => updateFilter({ maxPrice: val })}
          min={30000}
          max={500000}
          step={10000}
          className="py-2"
          aria-label="Harga maksimum"
        />
        <p className="mt-1 text-sm font-semibold text-primary">
          {filters.maxPrice >= 500000 ? 'Semua harga' : `≤ Rp${filters.maxPrice.toLocaleString('id-ID')}`}
        </p>
      </div>

      {/* Rating */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">Rating</h3>
        <div className="space-y-1.5">
          {[0, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => updateFilter({ minRating: r })}
              className={cn(
                'flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors',
                filters.minRating === r ? 'bg-secondary font-semibold text-primary' : 'hover:bg-muted'
              )}
            >
              {r === 0 ? (
                'Semua rating'
              ) : (
                <>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {r}+ 
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Diskon */}
      <div className="flex items-center justify-between">
        <label htmlFor="disc-only" className="text-sm font-bold">
          Hanya Produk Diskon
        </label>
        <Switch
          id="disc-only"
          checked={filters.discountedOnly}
          onCheckedChange={(checked) => updateFilter({ discountedOnly: checked })}
        />
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" onClick={resetFilters} className="w-full gap-1">
          <X className="h-4 w-4" /> Reset {activeFilterCount} Filter
        </Button>
      )}
    </div>
  )

  return (
    <main className="container mx-auto px-4 py-6">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading ? 'Memuat produk...' : `${total} produk ditemukan`}
        </p>
      </div>

      {/* Search & sort bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateFilter({ q: searchInput })
          }}
          className="relative flex-1 min-w-48"
          role="search"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              if (!e.target.value) updateFilter({ q: '' })
            }}
            placeholder="Cari di katalog..."
            className="pl-9"
            aria-label="Cari produk"
          />
        </form>

        <Select value={filters.sort} onValueChange={(val) => updateFilter({ sort: val })}>
          <SelectTrigger className="w-44" aria-label="Urutkan produk">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mobile filter trigger */}
        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-1.5 lg:hidden">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge className="ml-0.5 h-5 w-5 rounded-full p-0 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Produk</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{FilterPanel}</div>
            <Button
              className="mt-6 w-full bg-primary hover:bg-primary/90"
              onClick={() => setMobileFilterOpen(false)}
            >
              Terapkan ({total} produk)
            </Button>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filter (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filter produk">
          <div className="sticky top-40 max-h-[calc(100vh-11rem)] overflow-y-auto rounded-xl border bg-white p-5 custom-scrollbar">
            {FilterPanel}
          </div>
        </aside>

        {/* Grid produk */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
              <PackageSearch className="h-12 w-12 text-muted-foreground/50" aria-hidden />
              <h3 className="mt-4 font-semibold">Produk tidak ditemukan</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Coba ubah kata kunci pencarian atau reset filter yang aktif.
              </p>
              <Button onClick={resetFilters} variant="outline" className="mt-4">
                Reset Filter
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Navigasi halaman">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Sebelumnya
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
                    )
                    .map((p, idx, arr) => (
                      <span key={p} className="flex items-center gap-2">
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="text-muted-foreground">…</span>
                        )}
                        <Button
                          variant={p === page ? 'default' : 'outline'}
                          size="sm"
                          className={
                            p === page ? 'bg-primary hover:bg-primary/90' : 'min-w-9'
                          }
                          onClick={() => setPage(p)}
                          aria-current={p === page ? 'page' : undefined}
                        >
                          {p}
                        </Button>
                      </span>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Berikutnya
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* Kembali ke beranda */}
      <div className="mt-10 text-center">
        <Button variant="ghost" onClick={() => navigate({ name: 'home' })} className="text-primary">
          ← Kembali ke Beranda
        </Button>
      </div>
    </main>
  )
}
