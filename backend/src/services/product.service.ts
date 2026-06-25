import prisma from '../lib/prisma';
import { Prisma } from '../generated/prisma/client';

export const getProductsService = async (
  storeId?: number,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  filter?: string

) => {
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {};
  if (filter) {
    // Basic filter by name
    where.name = { contains: filter, mode: 'insensitive' };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        discounts: true,
        category: true,
        stocks: storeId ? {
          where: { storeId: storeId }
        } : true
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.product.count({ where })
  ]);

  return {
    data: products.map(p => ({
      ...p,
      // Map stock appropriately if storeId is provided or fall back to total overall if not
      stock: p.stocks && p.stocks.length > 0 ? p.stocks[0].quantity : 0
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
