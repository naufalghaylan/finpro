import prisma from '../lib/prisma';

export const getStocksService = async (storeId?: number, search?: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };
  if (storeId) {
    where.storeId = storeId;
  }
  // Selalu sembunyikan barang (produk) yang sudah di-soft delete
  where.product = { deletedAt: null };
  if (search) {
    where.product.name = {
      contains: search,
      mode: 'insensitive'
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
              where: { isPrimary: true, deletedAt: null },
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
  return await prisma.stock.findFirst({
    where: { id, deletedAt: null },
    include: {
      product: {
        include: {
          images: { where: { deletedAt: null } },
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
    // Cek apakah sudah ada baris stok untuk produk ini di toko ini (termasuk yang sudah di-soft delete).
    // Karena ada unique constraint (productId, storeId), baris yang ter-soft delete tetap memesan slot itu.
    const existingStock = await tx.stock.findFirst({
      where: { productId, storeId }
    });

    // Tolak jika sudah ada stok AKTIF
    if (existingStock && existingStock.deletedAt === null) {
      throw new Error('Stock already exists for this product in this store');
    }

    // Jika ada stok yang sudah di-soft delete, pulihkan (restore) & set ulang kuantitasnya
    if (existingStock) {
      const restoredStock = await tx.stock.update({
        where: { id: existingStock.id },
        data: { deletedAt: null, quantity },
        include: { product: true, store: true }
      });

      await tx.stockJournal.create({
        data: {
          stockId: restoredStock.id,
          quantityChange: quantity,
          quantityBefore: 0,
          quantityAfter: quantity,
          type: 'ADJUSTMENT',
          notes: notes || 'Restored stock',
          createdBy: userId,
          productSnapshot: restoredStock.product,
          storeSnapshot: restoredStock.store
        }
      });

      return restoredStock;
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

export const deleteStockService = async (stockId: number, userId: number) => {
  return await prisma.$transaction(async (tx) => {
    const stock = await tx.stock.findFirst({
      where: { id: stockId, deletedAt: null },
      include: { product: true, store: true }
    });
    if (!stock) {
      throw new Error('Stock not found');
    }

    const quantityBefore = stock.quantity;

    // Soft delete + set quantity=0 agar tidak muncul di query checkout (quantity > 0)
    await tx.stock.update({
      where: { id: stockId },
      data: { deletedAt: new Date(), quantity: 0 }
    });

    // Catat jurnal hanya jika ada qty yang berkurang (hindari entri jurnal perubahan 0)
    if (quantityBefore > 0) {
      await tx.stockJournal.create({
        data: {
          stockId,
          quantityChange: -quantityBefore,
          quantityBefore,
          quantityAfter: 0,
          type: 'ADJUSTMENT',
          notes: 'Stock removed from store (soft deleted)',
          createdBy: userId,
          productSnapshot: stock.product,
          storeSnapshot: stock.store
        }
      });
    }

    return { id: stockId };
  });
};
