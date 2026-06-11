import { z } from 'zod';

export const createStoreAdminSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    storeId: z.number().optional().nullable()
  })
});

export const assignStoreAdminSchema = z.object({
  body: z.object({
    storeId: z.number().nullable()
  })
});
