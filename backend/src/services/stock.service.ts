import prisma from '../lib/prisma';

export const getStocksService = async (storeId?: number, search?: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (storeId) {
    where.storeId = storeId;
  }
  if (search) {
    where.product = {
      name: {
        contains: search,
        mode: 'insensitive'
      }
    };
  }

  const [stocks, total] = await Promise.all([
    prisma.stock.findMany({
      where,
      include: {
        store: {
          select: { name: true }
        },
        product: {
          include: {
            category: true,
            images: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: { product: { name: 'asc' } }
    }),
    prisma.stock.count({ where })
  ]);

  return { stocks, total };
};

export const getStockByIdService = async (id: number) => {
  return await prisma.stock.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          images: true,
          category: true
        }
      },
      store: true,
      journals: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });
};

export const adjustStockService = async (stockId: number, quantityChange: number, notes: string | undefined, userId: number) => {
  return await prisma.$transaction(async (tx) => {
    const stock = await tx.stock.findUnique({
      where: { id: stockId },
      include: { product: true, store: true }
    });

    if (!stock) {
      throw new Error('Stock not found');
    }

    const quantityBefore = stock.quantity;
    const quantityAfter = quantityBefore + quantityChange;

    if (quantityAfter < 0) {
      throw new Error('Stock cannot be negative');
    }

    const updatedStock = await tx.stock.update({
      where: { id: stockId },
      data: { quantity: quantityAfter }
    });

    await tx.stockJournal.create({
      data: {
        stockId: stock.id,
        quantityChange,
        quantityBefore,
        quantityAfter,
        type: 'ADJUSTMENT',
        notes,
        createdBy: userId,
        productSnapshot: stock.product,
        storeSnapshot: stock.store
      }
    });

    return updatedStock;
  });
};

export const addStockService = async (productId: number, storeId: number, quantity: number, notes: string | undefined, userId: number) => {
  return await prisma.$transaction(async (tx) => {
    // Check if stock already exists
    const existingStock = await tx.stock.findFirst({
      where: { productId, storeId }
    });

    if (existingStock) {
      throw new Error('Stock already exists for this product in this store');
    }

    const newStock = await tx.stock.create({
      data: {
        productId,
        storeId,
        quantity
      },
      include: { product: true, store: true }
    });

    await tx.stockJournal.create({
      data: {
        stockId: newStock.id,
        quantityChange: quantity,
        quantityBefore: 0,
        quantityAfter: quantity,
        type: 'ADJUSTMENT',
        notes: notes || 'Initial stock',
        createdBy: userId,
        productSnapshot: newStock.product,
        storeSnapshot: newStock.store
      }
    });

    return newStock;
  });
};
