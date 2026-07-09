import { Prisma } from '../generated/prisma/client'
import prisma from '../lib/prisma'
import {
  checkoutDiscountSelect,
  getBestProductDiscount,
} from './order/checkout/order-discount.service'
import { getNearestStoreService } from './store.service'

type DatabaseClient = Prisma.TransactionClient

type GetCartOptions = {
  // Jika true, harga tiap item dikurangi diskon produk toko terdekat user (untuk halaman keranjang).
  // Default false agar pemanggil lain (mis. checkout preview) tetap menerima harga dasar.
  applyItemDiscounts?: boolean
  // Koordinat acuan dari frontend (alamat terpilih / geolokasi), sama seperti katalog.
  // Jika tidak diberikan, server memakai alamat utama user sebagai fallback.
  lat?: number
  lng?: number
}

const emptyCart = {
  id: null,
  store: null,
  items: [],
  summary: {
    totalQuantity: 0,
    subtotal: 0,
    discountAmount: 0,
    total: 0,
  },
}

export const createCart = async (userId: number, db: DatabaseClient = prisma) => {
  return db.cart.create({
    data: { userId },
    select: { id: true },
  })
}

export const getOrCreateCart = async (userId: number, db: DatabaseClient = prisma) => {
  return db.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  })
}

export const getCartItemCount = async (cartId: number, db: DatabaseClient = prisma) => {
  const countAgg = await db.cartItem.aggregate({
    where: { cartId },
    _sum: { quantity: true },
  })

  return countAgg._sum.quantity ?? 0
}

const getProductStockTotals = async (productIds: number[], db: DatabaseClient = prisma) => {
  if (productIds.length === 0) {
    return new Map<number, number>()
  }

  const stockTotals = await db.stock.groupBy({
    by: ['productId'],
    where: {
      productId: { in: productIds },
    },
    _sum: { quantity: true },
  })

  return new Map(stockTotals.map((stock) => [stock.productId, stock._sum.quantity ?? 0]))
}

// Diskon produk yang sedang berlaku untuk produk-produk di keranjang.
// Dibatasi ke satu toko (storeId) agar konsisten dengan katalog & checkout,
// yang keduanya memakai diskon toko terdekat — bukan diskon terbesar lintas toko.
const getActiveProductDiscounts = async (productIds: number[], storeId?: number) => {
  if (productIds.length === 0) {
    return []
  }

  return prisma.discount.findMany({
    where: {
      productId: { in: productIds },
      ...(storeId ? { storeId } : {}),
      isActive: true,
      deletedAt: null,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
    select: checkoutDiscountSelect,
  })
}

// Tentukan toko acuan untuk diskon keranjang: toko terdekat dari alamat user
// (utama, lalu alamat pertama) — sama seperti cara checkout memilih toko.
// Mengembalikan undefined bila user belum punya alamat berkoordinat.
const resolveUserStoreId = async (userId: number): Promise<number | undefined> => {
  const address = await prisma.userAddress.findFirst({
    where: {
      userId,
      deletedAt: null,
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
    select: { latitude: true, longitude: true },
  })

  if (address?.latitude == null || address?.longitude == null) {
    return undefined
  }

  const nearest = await getNearestStoreService(address.latitude, address.longitude)
  return nearest?.id
}

// Toko acuan diskon: pakai koordinat dari frontend bila ada (sama dengan katalog),
// jika tidak, fallback ke alamat utama user di server.
const resolveDiscountStoreId = async (userId: number, options: GetCartOptions): Promise<number | undefined> => {
  if (options.lat !== undefined && options.lng !== undefined) {
    const nearest = await getNearestStoreService(options.lat, options.lng)
    if (nearest) return nearest.id
  }
  return resolveUserStoreId(userId)
}

export const getCart = async (userId: number, options: GetCartOptions = {}) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      id: true,
      store: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
        },
      },
      items: {
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          productId: true,
          quantity: true,
          createdAt: true,
          updatedAt: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              weight: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              images: {
                where: { deletedAt: null },
                orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                select: {
                  id: true,
                  imageUrl: true,
                  isPrimary: true,
                  sortOrder: true,
                },
              },
              stocks: {
                select: {
                  id: true,
                  quantity: true,
                  store: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                      city: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!cart) {
    return emptyCart
  }

  const applyItemDiscounts = options.applyItemDiscounts ?? false
  const productIds = cart.items.map((item) => item.productId)
  // Diskon per item hanya dihitung untuk halaman keranjang, dan dibatasi ke toko
  // terdekat user supaya harganya sama dengan yang tampil di katalog & checkout.
  const discountStoreId = applyItemDiscounts ? await resolveDiscountStoreId(userId, options) : undefined
  const [stockTotals, activeDiscounts] = await Promise.all([
    getProductStockTotals(productIds),
    applyItemDiscounts ? getActiveProductDiscounts(productIds, discountStoreId) : Promise.resolve([]),
  ])

  const items = cart.items.map((item) => {
    const totalStock = stockTotals.get(item.productId) ?? 0
    const baseLineTotal = item.quantity * item.product.basePrice
    // Pakai helper yang sama dengan checkout: ambil diskon produk terbaik,
    // sudah termasuk batas maxDiscount dan aturan BUY_ONE_GET_ONE.
    const bestDiscount = getBestProductDiscount(
      { productId: item.productId, quantity: item.quantity, product: { basePrice: item.product.basePrice } },
      activeDiscounts,
    )
    const discountAmount = Math.round(bestDiscount.amount)
    const lineTotal = Math.max(0, baseLineTotal - discountAmount)

    return {
      ...item,
      product: {
        ...item.product,
        totalStock,
      },
      baseLineTotal,
      discountAmount,
      lineTotal,
    }
  })

  const summary = items.reduce(
    (acc, item) => ({
      totalQuantity: acc.totalQuantity + item.quantity,
      subtotal: acc.subtotal + item.baseLineTotal,
      discountAmount: acc.discountAmount + item.discountAmount,
      total: acc.total + item.lineTotal,
    }),
    { totalQuantity: 0, subtotal: 0, discountAmount: 0, total: 0 },
  )

  return {
    id: cart.id,
    store: cart.store,
    items,
    summary,
  }
}

export const getCartCount = async (userId: number) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!cart) {
    return 0
  }

  return getCartItemCount(cart.id)
}
