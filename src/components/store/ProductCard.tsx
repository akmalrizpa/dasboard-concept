 
'use client'

import { memo } from 'react'
import { Star } from 'lucide-react'
import { formatIDR, discountPercent } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

function ProductCard({ product }: { product: Product }) {
  const navigate = useAppStore((s) => s.navigate)
  const discount = product.isFlashSale && product.flashPrice
    ? discountPercent(product.flashPrice, product.price)
    : discountPercent(product.price, product.originalPrice)
  const displayPrice = product.isFlashSale && product.flashPrice ? product.flashPrice : product.price

  return (
    <button
      onClick={() => navigate({ name: 'product', slug: product.slug })}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Lihat ${product.name}`}
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-50">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-md bg-white/90 px-3 py-1 text-xs font-bold text-neutral-800">
              Stok Habis
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
          {product.brand.name}
        </p>
        <p className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-neutral-800">
          {product.name}
        </p>
        <div className="flex items-center gap-1 text-[11px] text-neutral-500">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
          <span className="font-semibold text-neutral-700">
            {product.rating > 0 ? product.rating.toFixed(1) : 'Baru'}
          </span>
          {product.reviewCount > 0 && <span>({product.reviewCount})</span>}
          <span aria-hidden>•</span>
          <span>{product.sold > 999 ? `${(product.sold / 1000).toFixed(1)}rb` : product.sold} terjual</span>
        </div>
        <div className="mt-auto pt-1">
          {product.originalPrice && product.originalPrice > displayPrice && (
            <p className="text-[11px] text-neutral-400 line-through">
              {formatIDR(product.originalPrice)}
            </p>
          )}
          <p className={cn('text-sm font-bold', product.isFlashSale ? 'text-primary' : 'text-neutral-900')}>
            {formatIDR(displayPrice)}
          </p>
        </div>
      </div>
    </button>
  )
}

export default memo(ProductCard)
