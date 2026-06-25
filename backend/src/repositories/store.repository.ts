import prisma from '../lib/prisma';
import { Prisma } from '../generated/prisma/client';

export const createStoreRepository = async (data: Prisma.StoreCreateInput) => {
  return await prisma.store.create({ data });
};

export const updateStoreRepository = async (id: number, data: Prisma.StoreUpdateInput) => {
  return await prisma.store.update({ where: { id }, data });
};

export const deleteStoreRepository = async (id: number) => {
  return await prisma.store.update({ where: { id }, data: { deletedAt: new Date() } });
};

export const getStoresRepository = async (skip: number, take: number, search?: string, userId?: number, role?: string) => {
  const where: any = { deletedAt: null };
  if (search) {
    where.name = { contains: search, mode: 'insensitive' as const };
  }
  
  if (role === 'STORE_ADMIN' && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.storeId) {
      where.id = user.storeId;
    } else {
      where.id = -1; // Force empty result if store admin has no store
    }
  }
  const [stores, total] = await Promise.all([
    prisma.store.findMany({ 
      where, 
      skip, 
      take, 
      include: { 
        _count: { select: { admins: true } },
        admins: { select: { id: true, name: true, email: true, createdAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.store.count({ where })
  ]);
  return { stores, total };
};

export const getStoreByIdRepository = async (id: number) => {
  return await prisma.store.findFirst({
    where: { id, deletedAt: null },
    include: { 
      admins: { 
        select: { id: true, name: true, email: true, createdAt: true } 
      } 
    } 
  });
};
