import prisma from './prisma'

interface ProductFilters {
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  storeId?: number
  limit?: number
  offset?: number
  sortBy?: 'name' | 'price' | 'newest'
}

interface SearchFilters extends ProductFilters {
  keyword?: string
}

// Get all products with filters
export async function getAllProducts(filters: ProductFilters) {
  const {
    categoryId, minPrice, maxPrice, storeId,
    limit = 20, offset = 0, sortBy = 'newest'
  } = filters

  const where: any = {}
  if (categoryId) where.categoryId = categoryId
  if (minPrice || maxPrice) {
    where.basePrice = {}
    if (minPrice) where.basePrice.gte = minPrice
    if (maxPrice) where.basePrice.lte = maxPrice
  }
  if (storeId) where.stocks = { some: { storeId } }

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
        images: { select: { id: true, imageUrl: true, isPrimary: true, sortOrder: true } },
        stocks: storeId ? { where: { storeId }, select: { id: true, quantity: true } } : false
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

  const where: any = {}
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
        images: { select: { id: true, imageUrl: true, isPrimary: true, sortOrder: true } },
        stocks: otherFilters.storeId
          ? { where: { storeId: otherFilters.storeId }, select: { id: true, quantity: true } }
          : false
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
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { select: { id: true, imageUrl: true, isPrimary: true, sortOrder: true } },
      stocks: {
        include: {
          store: {
            select: { id: true, name: true, address: true, city: true, latitude: true, longitude: true }
          }
        }
      },
      discounts: { where: { isActive: true } }
    }
  })

  if (!product) throw new Error('Product not found')
  return product
}

// Get all categories
export async function getCategories() {
  return await prisma.category.findMany({
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
  const existing = await prisma.product.findFirst({ where: { name: data.name } })
  if (existing) throw new Error('Produk dengan nama yang sama sudah ada')
  return await prisma.product.create({ data })
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
    const existing = await prisma.product.findFirst({ where: { name: data.name } })
    if (existing) throw new Error('Produk dengan nama yang sama sudah ada')
  }

  return await prisma.product.update({ where: { id }, data })
}

export async function deleteProduct(id: number) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new Error('Product not found')
  await prisma.product.delete({ where: { id } })
}

// ─── Admin: Category CRUD ──────────────────────────────────────────────────

export async function createCategory(data: { name: string; slug: string; icon?: string; description?: string }) {
  const existing = await prisma.category.findFirst({ where: { name: data.name } })
  if (existing) throw new Error('Kategori dengan nama yang sama sudah ada')
  return await prisma.category.create({ data })
}

export async function updateCategory(id: number, data: { name?: string; slug?: string; icon?: string; description?: string }) {
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) throw new Error('Category not found')
  if (data.name && data.name !== category.name) {
    const existing = await prisma.category.findFirst({ where: { name: data.name } })
    if (existing) throw new Error('Kategori dengan nama yang sama sudah ada')
  }
  return await prisma.category.update({ where: { id }, data })
}

export async function deleteCategory(id: number) {
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) throw new Error('Category not found')
  await prisma.category.delete({ where: { id } })
}

// ─── Product Images ────────────────────────────────────────────────────────

export async function addProductImage(productId: number, imageUrl: string, isPrimary: boolean, sortOrder: number) {
  return await prisma.productImage.create({ data: { productId, imageUrl, isPrimary, sortOrder } })
}

export async function removeProductImage(imageId: number) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } })
  if (!image) throw new Error('Image not found')
  await prisma.productImage.delete({ where: { id: imageId } })
  return image
}
