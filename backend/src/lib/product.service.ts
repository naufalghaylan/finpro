import prisma from './prisma'
import { getNearestStoreService } from '../services/store.service'

interface ProductFilters {
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  storeId?: number
  // Lokasi user (opsional). Jika ada, stok yang ditampilkan diambil dari toko terdekat.
  lat?: number
  lng?: number
  limit?: number
  offset?: number
  sortBy?: 'name' | 'price' | 'newest'
}

// Tentukan toko mana yang stoknya ditampilkan:
// - Jika storeId eksplisit → pakai itu.
// - Jika tidak, tapi ada lat/lng → pakai toko terdekat dari lokasi user.
// - Jika keduanya tidak ada → undefined (stok dijumlahkan dari semua toko).
async function resolveStockStoreId(
  storeId?: number,
  lat?: number,
  lng?: number
): Promise<number | undefined> {
  if (storeId) return storeId
  if (lat !== undefined && lng !== undefined) {
    const nearest = await getNearestStoreService(lat, lng)
    if (nearest) return nearest.id
  }
  return undefined
}

interface SearchFilters extends ProductFilters {
  keyword?: string
}

// Get all products with filters
export async function getAllProducts(filters: ProductFilters) {
  const {
    categoryId, minPrice, maxPrice, storeId, lat, lng,
    limit = 20, offset = 0, sortBy = 'newest'
  } = filters

  const where: any = {deletedAt: null}
  if (categoryId) where.categoryId = categoryId
  if (minPrice || maxPrice) {
    where.basePrice = {}
    if (minPrice) where.basePrice.gte = minPrice
    if (maxPrice) where.basePrice.lte = maxPrice
  }
  if (storeId) where.stocks = { some: { storeId } }

  // Stok yang ditampilkan: toko terdekat (jika ada lokasi) atau semua toko.
  const stockStoreId = await resolveStockStoreId(storeId, lat, lng)
  const now = new Date()

  const orderBy: any = {}
  switch (sortBy) {
    case 'name': orderBy.name = 'asc'; break
    case 'price': orderBy.basePrice = 'asc'; break
    default: orderBy.createdAt = 'desc'
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        images: {
          where: { deletedAt: null },
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          select: { id: true, imageUrl: true, isPrimary: true, sortOrder: true },
        },
        // Selalu sertakan stok agar katalog bisa menghitung total stok.
        // Jika ada toko (terdekat/eksplisit), batasi ke toko itu; selain itu jumlahkan semua toko.
        stocks: {
          where: stockStoreId ? { storeId: stockStoreId, deletedAt: null } : { deletedAt: null },
          select: { id: true, quantity: true }
        },
        // Diskon produk yang sedang berlaku, untuk menampilkan harga coret di kartu.
        discounts: {
          where: {
            ...(stockStoreId ? { storeId: stockStoreId } : {}),
            isActive: true,
            deletedAt: null,
            startDate: { lte: now },
            endDate: { gte: now },
          },
          select: { id: true, discountType: true, discountValue: true, minPurchase: true, maxDiscount: true, isActive: true },
        }
      },
      orderBy,
      take: limit,
      skip: offset
    }),
    prisma.product.count({ where })
  ])

  return { products, total, limit, offset, hasMore: offset + limit < total }
}

// Search products
export async function searchProducts(keyword: string, filters: SearchFilters) {
  const { limit = 20, offset = 0, sortBy = 'newest', ...otherFilters } = filters

  const where: any = { deletedAt: null }
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } }
    ]
  }
  if (otherFilters.categoryId) where.categoryId = otherFilters.categoryId
  if (otherFilters.minPrice || otherFilters.maxPrice) {
    where.basePrice = {}
    if (otherFilters.minPrice) where.basePrice.gte = otherFilters.minPrice
    if (otherFilters.maxPrice) where.basePrice.lte = otherFilters.maxPrice
  }
  if (otherFilters.storeId) where.stocks = { some: { storeId: otherFilters.storeId } }

  // Stok yang ditampilkan: toko terdekat (jika ada lokasi) atau semua toko.
  const stockStoreId = await resolveStockStoreId(otherFilters.storeId, otherFilters.lat, otherFilters.lng)
  const now = new Date()

  const orderBy: any = {}
  switch (sortBy) {
    case 'name': orderBy.name = 'asc'; break
    case 'price': orderBy.basePrice = 'asc'; break
    default: orderBy.createdAt = 'desc'
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        images: {
          where: { deletedAt: null },
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          select: { id: true, imageUrl: true, isPrimary: true, sortOrder: true },
        },
        // Selalu sertakan stok agar hasil pencarian bisa menghitung total stok.
        stocks: {
          where: stockStoreId
            ? { storeId: stockStoreId, deletedAt: null }
            : { deletedAt: null },
          select: { id: true, quantity: true }
        },
        // Diskon produk yang sedang berlaku, untuk menampilkan harga coret di kartu.
        discounts: {
          where: {
            ...(stockStoreId ? { storeId: stockStoreId } : {}),
            isActive: true,
            deletedAt: null,
            startDate: { lte: now },
            endDate: { gte: now },
          },
          select: { id: true, discountType: true, discountValue: true, minPurchase: true, maxDiscount: true, isActive: true },
        }
      },
      orderBy,
      take: limit,
      skip: offset
    }),
    prisma.product.count({ where })
  ])

  return { products, total, limit, offset, hasMore: offset + limit < total }
}

// Get product by ID
export async function getProductById(id: number) {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      images: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        select: { id: true, imageUrl: true, isPrimary: true, sortOrder: true },
      },
      stocks: {
        include: {
          store: {
            select: { id: true, name: true, address: true, city: true, latitude: true, longitude: true }
          }
        }
      },
      discounts: { where: { isActive: true, deletedAt: null } }
    }
  })

  if (!product) throw new Error('Product not found')
  return product
}

// Get all categories
export async function getCategories() {
  return await prisma.category.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, slug: true, icon: true, description: true },
    orderBy: { name: 'asc' }
  })
}

// Get category by ID
export async function getCategoryById(id: number) {
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) throw new Error('Category not found')
  return category
}

// Get products by category
export async function getProductsByCategory(categoryId: number, filters: ProductFilters) {
  return getAllProducts({ ...filters, categoryId })
}

// ─── Admin: Product CRUD ───────────────────────────────────────────────────

export async function createProduct(data: {
  name: string
  slug: string
  description?: string
  weight?: number
  categoryId: number
  basePrice: number
}) {
  return await prisma.$transaction(async (tx) => {
    // Tolak jika ada produk AKTIF dengan nama sama
    const active = await tx.product.findFirst({ where: { name: data.name, deletedAt: null } })
    if (active) throw new Error('Produk dengan nama yang sama sudah ada')

    // Jika ada produk dengan nama sama yang sudah dihapus (soft delete), pulihkan & perbarui datanya
    const deleted = await tx.product.findFirst({ where: { name: data.name, deletedAt: { not: null } } })
    if (deleted) {
      return await tx.product.update({
        where: { id: deleted.id },
        data: { ...data, deletedAt: null },
      })
    }

    return await tx.product.create({ data })
  })
}

export async function updateProduct(id: number, data: {
  name?: string
  slug?: string
  description?: string
  weight?: number
  categoryId?: number
  basePrice?: number
}) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new Error('Product not found')

  if (data.name && data.name !== product.name) {
    const existing = await prisma.product.findFirst({ where: { name: data.name, deletedAt: null } })
    if (existing) throw new Error('Produk dengan nama yang sama sudah ada')
  }

  return await prisma.product.update({ where: { id }, data })
}

export async function deleteProduct(id: number) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new Error('Product not found')
  await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } })
}

// ─── Admin: Category CRUD ──────────────────────────────────────────────────

export async function createCategory(data: { name: string; slug: string; icon?: string; description?: string }) {
  return await prisma.$transaction(async (tx) => {
    // Tolak jika ada kategori AKTIF dengan nama sama
    const active = await tx.category.findFirst({ where: { name: data.name, deletedAt: null } })
    if (active) throw new Error('Kategori dengan nama yang sama sudah ada')

    // Jika ada kategori dengan nama sama yang sudah dihapus (soft delete), pulihkan & perbarui datanya
    const deleted = await tx.category.findFirst({ where: { name: data.name, deletedAt: { not: null } } })
    if (deleted) {
      return await tx.category.update({
        where: { id: deleted.id },
        data: { ...data, deletedAt: null },
      })
    }

    return await tx.category.create({ data })
  })
}

export async function updateCategory(id: number, data: { name?: string; slug?: string; icon?: string; description?: string }) {
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) throw new Error('Category not found')
  if (data.name && data.name !== category.name) {
    const existing = await prisma.category.findFirst({ where: { name: data.name, deletedAt: null } })
    if (existing) throw new Error('Kategori dengan nama yang sama sudah ada')
  }
  return await prisma.category.update({ where: { id }, data })
}

export async function deleteCategory(id: number) {
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) throw new Error('Category not found')

  const activeProducts = await prisma.product.count({ where: { categoryId: id, deletedAt: null } })
  if (activeProducts > 0) throw new Error('Kategori masih memiliki produk aktif, tidak bisa dihapus')

  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } })
}


// ─── Product Images ────────────────────────────────────────────────────────

export const MAX_PRODUCT_IMAGES = 3

export async function addProductImage(productId: number, imageUrl: string) {
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    })
    if (!product) throw new Error('Product not found')

    const count = await tx.productImage.count({ where: { productId, deletedAt: null } })
    if (count >= MAX_PRODUCT_IMAGES) {
      throw new Error('Maksimal 3 foto per produk')
    }

    const primaryCount = await tx.productImage.count({ where: { productId, isPrimary: true, deletedAt: null } })
    const maxPos = await tx.productImage.aggregate({
      where: { productId, deletedAt: null },
      _max: { sortOrder: true },
    })
    const nextSortOrder = (maxPos._max.sortOrder ?? -1) + 1

    return tx.productImage.create({
      data: {
        productId,
        imageUrl,
        isPrimary: primaryCount === 0,
        sortOrder: nextSortOrder,
      },
    })
  })
}

export async function removeProductImage(imageId: number) {
  return await prisma.$transaction(async (tx) => {
    const image = await tx.productImage.findFirst({ where: { id: imageId, deletedAt: null } })
    if (!image) throw new Error('Image not found')

    await tx.productImage.update({ where: { id: imageId }, data: { deletedAt: new Date(), isPrimary: false } })

    // Kalau foto yang dihapus adalah primary, promosikan foto berikutnya jadi primary
    if (image.isPrimary) {
      const next = await tx.productImage.findFirst({
        where: { productId: image.productId, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      })
      if (next) {
        await tx.productImage.update({ where: { id: next.id }, data: { isPrimary: true } })
      }
    }

    return image
  })
}
