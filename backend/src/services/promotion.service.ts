import prisma from '../lib/prisma';

export const getActivePromotionsService = async () => {
  const now = new Date();
  
  const promotions = await prisma.discount.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      startDate: { lte: now },
      endDate: { gte: now }
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          image: true,
          slug: true,
          basePrice: true,
          category: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5 // Top 5 active discounts for hero section carousel
  });

  return promotions;
};
