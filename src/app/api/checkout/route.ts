import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateOrderNumber } from '@/lib/format'
import { getSettings } from '@/lib/settings'

interface CheckoutItem {
  productId: string
  quantity: number
}

interface CheckoutBody {
  customerName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  notes?: string
  shippingMethod: string
  paymentMethod: string
  voucherCode?: string
  items: CheckoutItem[]
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody

    // Validasi input
    if (!body.customerName?.trim() || !body.email?.trim() || !body.phone?.trim()) {
      return NextResponse.json({ error: 'Nama, email, dan nomor HP wajib diisi' }, { status: 400 })
    }
    if (!body.address?.trim() || !body.city?.trim() || !body.postalCode?.trim()) {
      return NextResponse.json({ error: 'Alamat pengiriman belum lengkap' }, { status: 400 })
    }
    if (!body.items?.length) {
      return NextResponse.json({ error: 'Keranjang belanja kosong' }, { status: 400 })
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    }

    // ===== Ongkir dinamis dari database =====
    const shipping = await db.shippingMethod.findUnique({ where: { code: body.shippingMethod } })
    if (!shipping || !shipping.isActive) {
      return NextResponse.json({ error: 'Metode pengiriman tidak valid' }, { status: 400 })
    }
    let shippingCost = shipping.cost

    // ===== Metode pembayaran dinamis =====
    const payment = await db.paymentMethod.findUnique({ where: { code: body.paymentMethod } })
    if (!payment || !payment.isActive) {
      return NextResponse.json({ error: 'Metode pembayaran tidak valid' }, { status: 400 })
    }

    // ===== Batas gratis ongkir dinamis =====
    const settings = await getSettings()
    const freeThreshold = Number(settings['shipping.freeThreshold']) || 0

    // Ambil produk & hitung harga di server (jangan percaya harga dari klien)
    const productIds = body.items.map((i) => i.productId)
    const products = await db.product.findMany({ where: { id: { in: productIds }, isActive: true } })

    if (products.length === 0) {
      return NextResponse.json({ error: 'Produk tidak tersedia' }, { status: 400 })
    }

    let subtotal = 0
    const orderItems: {
      productId: string
      name: string
      image: string
      quantity: number
      price: number
    }[] = []

    for (const item of body.items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) continue
      const qty = Math.max(1, Math.min(item.quantity, product.stock))
      const unitPrice = product.isFlashSale && product.flashPrice ? product.flashPrice : product.price
      subtotal += unitPrice * qty
      orderItems.push({
        productId: product.id,
        name: product.name,
        image: product.image,
        quantity: qty,
        price: unitPrice,
      })
    }

    // ===== Gratis ongkir jika subtotal melewati batas =====
    if (freeThreshold > 0 && subtotal >= freeThreshold) shippingCost = 0

    // ===== Validasi & terapkan voucher (dihitung ulang di server) =====
    let discount = 0
    let voucherCode: string | null = null
    let voucherFreeShipping = false
    const code = body.voucherCode?.trim().toUpperCase()
    if (code) {
      const now = new Date()
      const voucher = await db.voucher.findUnique({ where: { code } })
      if (
        voucher &&
        voucher.isActive &&
        voucher.startsAt <= now &&
        voucher.expiresAt >= now &&
        !(voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) &&
        subtotal >= voucher.minPurchase
      ) {
        voucherCode = voucher.code
        if (voucher.type === 'PERCENT') {
          discount = Math.floor((subtotal * voucher.value) / 100)
          if (voucher.maxDiscount > 0) discount = Math.min(discount, voucher.maxDiscount)
        } else if (voucher.type === 'FIXED') {
          discount = Math.min(voucher.value, subtotal)
        } else if (voucher.type === 'FREE_SHIPPING') {
          voucherFreeShipping = true
        }
      } else {
        return NextResponse.json({ error: 'Voucher tidak valid atau tidak memenuhi syarat' }, { status: 400 })
      }
    }
    if (voucherFreeShipping) shippingCost = 0

    const paymentFee = payment.fee || 0
    const total = Math.max(0, subtotal - discount) + shippingCost + paymentFee

    // Upsert customer berdasarkan email
    const customer = await db.customer.upsert({
      where: { email: body.email.toLowerCase().trim() },
      update: {
        name: body.customerName.trim(),
        phone: body.phone.trim(),
        address: body.address.trim(),
        city: body.city.trim(),
        postalCode: body.postalCode.trim(),
      },
      create: {
        name: body.customerName.trim(),
        email: body.email.toLowerCase().trim(),
        phone: body.phone.trim(),
        address: body.address.trim(),
        city: body.city.trim(),
        postalCode: body.postalCode.trim(),
      },
    })

    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: customer.id,
        customerName: body.customerName.trim(),
        email: customer.email,
        phone: body.phone.trim(),
        address: body.address.trim(),
        city: body.city.trim(),
        postalCode: body.postalCode.trim(),
        notes: body.notes?.trim() || null,
        subtotal,
        shippingCost,
        discount,
        voucherCode,
        total,
        paymentMethod: body.paymentMethod,
        status: 'PENDING',
        items: { create: orderItems },
      },
      include: { items: true },
    })

    // Tandai pemakaian voucher
    if (voucherCode) {
      await db.voucher.update({
        where: { code: voucherCode },
        data: { usedCount: { increment: 1 } },
      })
    }

    // Kurangi stok & tambah sold (flash sale juga)
    for (const item of orderItems) {
      const product = products.find((p) => p.id === item.productId)!
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          sold: { increment: item.quantity },
          ...(product.isFlashSale ? { flashSold: { increment: item.quantity } } : {}),
        },
      })
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
      discount: order.discount,
      voucherCode: order.voucherCode,
    })
  } catch (e) {
    console.error('POST /api/checkout error', e)
    return NextResponse.json({ error: 'Gagal membuat pesanan. Silakan coba lagi.' }, { status: 500 })
  }
}
