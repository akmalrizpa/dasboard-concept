/** Tipe data bersama BeautyLoka */

export interface Category {
  id: string
  name: string
  slug: string
  image?: string | null
  icon?: string | null
  productCount?: number
}

export interface Brand {
  id: string
  name: string
  slug: string
  isFeatured?: boolean
  productCount?: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number | null
  stock: number
  rating: number
  reviewCount: number
  sold: number
  image: string
  isFlashSale: boolean
  flashPrice?: number | null
  flashStock?: number
  flashSold?: number
  isActive: boolean
  categoryId: string
  brandId: string
  category: Category
  brand: Brand
  createdAt: string
  updatedAt?: string
}

export interface Review {
  id: string
  productId: string
  author: string
  rating: number
  comment: string
  createdAt: string
}

export interface ProductWithReviews extends Product {
  reviews: Review[]
}

export interface Banner {
  id: string
  title: string
  subtitle?: string | null
  image: string
  link?: string | null
  isActive: boolean
  sortOrder: number
}

/** Artikel Beauty Journal (dinamis) */
export interface Article {
  id: string
  emoji: string
  tag: string
  title: string
  excerpt: string
  isActive: boolean
  sortOrder: number
}

/** Jendela flash sale aktif (dinamis) */
export interface FlashWindow {
  id: string
  title: string
  startsAt: string
  endsAt: string
}

/** Pengaturan toko (key-value, ter-parse) */
export type SettingsMap = Record<string, unknown>

export interface HomeData {
  banners: Banner[]
  categories: Category[]
  brands: Brand[]
  flashSale: Product[]
  bestSellers: Product[]
  newest: Product[]
  settings: SettingsMap
  flashWindow: FlashWindow | null
  articles: Article[]
}

/** Metode pengiriman dinamis */
export interface ShippingMethodDto {
  id: string
  code: string
  label: string
  eta: string
  cost: number
  isActive: boolean
  sortOrder: number
}

/** Metode pembayaran dinamis */
export interface PaymentMethodDto {
  id: string
  code: string
  label: string
  group: string
  desc: string
  fee: number
  isActive: boolean
  sortOrder: number
}

/** Info voucher publik (tanpa data sensitif) */
export interface VoucherPublic {
  code: string
  description: string
  type: 'PERCENT' | 'FIXED' | 'FREE_SHIPPING'
  value: number
  minPurchase: number
  maxDiscount: number
}

/** Konfigurasi checkout dari server */
export interface CheckoutConfig {
  shippingMethods: ShippingMethodDto[]
  paymentMethods: PaymentMethodDto[]
  vouchers: VoucherPublic[]
  freeShippingThreshold: number
  codFee: number
}

/** Hasil validasi voucher */
export interface VoucherValidation {
  valid: boolean
  discount: number
  freeShipping: boolean
  voucher?: VoucherPublic
  error?: string
}

/** Voucher lengkap (admin) */
export interface VoucherFull {
  id: string
  code: string
  description: string
  type: 'PERCENT' | 'FIXED' | 'FREE_SHIPPING'
  value: number
  minPurchase: number
  maxDiscount: number
  usageLimit: number
  usedCount: number
  startsAt: string
  expiresAt: string
  isActive: boolean
  createdAt: string
}

/** Jendela flash sale lengkap (admin) */
export interface FlashSaleFull {
  id: string
  title: string
  startsAt: string
  endsAt: string
  isActive: boolean
  createdAt: string
}

export interface OrderItem {
  id: string
  productId: string
  name: string
  image: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  notes?: string | null
  subtotal: number
  shippingCost: number
  discount?: number
  voucherCode?: string | null
  total: number
  paymentMethod: string
  status: string
  items: OrderItem[]
  createdAt: string
  updatedAt?: string
}

export interface CustomerSummary {
  id: string
  name: string
  email: string
  phone?: string | null
  city?: string | null
  createdAt: string
  totalOrders: number
  totalSpent: number
}

export interface AdminStats {
  stats: {
    totalRevenue: number
    todayRevenue: number
    yesterdayRevenue: number
    totalOrders: number
    ordersToday: number
    ordersYesterday: number
    orders30: number
    pendingOrders: number
    totalProducts: number
    totalCustomers: number
  }
  salesChart: { date: string; label: string; orders: number; revenue: number }[]
  statusBreakdown: { status: string; count: number }[]
  topProducts: {
    productId: string
    name: string
    image: string
    price: number
    totalSold: number
    revenue: number
  }[]
  recentOrders: Order[]
  lowStockProducts: { id: string; name: string; stock: number; image: string }[]
}
