import prisma from '../lib/prisma';
import { Prisma } from '../generated/prisma/client';

export const createStoreAdminRepository = async (data: Prisma.UserCreateInput) => {
  return await prisma.user.create({ data });
};
