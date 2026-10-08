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

export interface HomeData {
  banners: Banner[]
  categories: Category[]
  brands: Brand[]
  flashSale: Product[]
  bestSellers: Product[]
  newest: Product[]
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
