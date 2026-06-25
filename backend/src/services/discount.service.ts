import prisma from '../lib/prisma';
import { Prisma } from '../generated/prisma/client';

export const getDiscountsService = async (storeId?: number, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };
  if (storeId) {
    where.storeId = storeId;
  }

  const [discounts, total] = await Promise.all([
    prisma.discount.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true }
        },
        store: {
          select: { id: true, name: true }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.discount.count({ where })
  ]);

  return { discounts, total };
};

export const createDiscountService = async (data: Prisma.DiscountUncheckedCreateInput) => {
  return await prisma.discount.create({
    data
  });
};

export const updateDiscountService = async (id: number, data: Prisma.DiscountUncheckedUpdateInput) => {
  return await prisma.discount.update({
    where: { id },
    data
  });
};

export const deleteDiscountService = async (id: number) => {
  return await prisma.discount.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
};

export const getDiscountByIdService = async (id: number) => {
  return await prisma.discount.findFirst({
    where: { id, deletedAt: null }
  });
};
