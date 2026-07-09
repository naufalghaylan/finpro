import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { Role } from '../generated/prisma/client'

const createStoreAdminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(3, 'Username min 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password min 6 karakter'),
})

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
})

// Helper: build where clause untuk filter
function buildUserWhere(search: string, role?: string) {
  return {
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { username: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(role ? { role: role as Role } : {}),
  }
}

// GET /admin/users — list semua user dengan pagination + filter + sort +++++++(buat jadi utilitis)
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.max(1, Number(req.query.limit) || 10)
    const search = String(req.query.search || '')
    const role = req.query.role as string | undefined
    const sortBy = ['name', 'email', 'createdAt'].includes(String(req.query.sortBy))
      ? String(req.query.sortBy) : 'createdAt'
    const order = req.query.order === 'asc' ? 'asc' : 'desc'

    const where = buildUserWhere(search, role)
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, username: true, email: true, role: true, emailVerified: true, createdAt: true },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])
    res.json({ data: users, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('[listUsers]', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// POST /admin/users — buat akun STORE_ADMIN
export const createStoreAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createStoreAdminSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }
    const { name, username, email, password } = parsed.data

    // Konflik dengan user AKTIF (belum dihapus) benar-benar ditolak
    const activeConflict = await prisma.user.findFirst({
      where: { deletedAt: null, OR: [{ email }, { username }] },
    })
    if (activeConflict) {
      const message = activeConflict.email === email ? 'Email already registered' : 'Username already taken'
      res.status(409).json({ message })
      return
    }

    const hashed = await bcrypt.hash(password, 10)
    const userData = { name, username, email, password: hashed, role: 'STORE_ADMIN' as const, emailVerified: true }
    const select = { id: true, name: true, username: true, email: true, role: true, createdAt: true }

    // Kalau ada user yang sudah di-soft-delete dengan email/username sama → pulihkan (restore), bukan error
    const softDeleted = await prisma.user.findFirst({
      where: { deletedAt: { not: null }, OR: [{ email }, { username }] },
    })

    const user = softDeleted
      ? await prisma.user.update({ where: { id: softDeleted.id }, data: { ...userData, deletedAt: null }, select })
      : await prisma.user.create({ data: userData, select })

    res.status(201).json({ message: 'Store admin created', data: user })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      res.status(409).json({ message: 'Email atau username sudah dipakai akun lain' })
      return
    }
    console.error('[createStoreAdmin]', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// PUT /admin/users/:id — update user 
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const parsed = updateUserSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) { res.status(404).json({ message: 'User not found' }); return }
    if (existing.role === 'SUPER_ADMIN') { res.status(403).json({ message: 'Cannot modify super admin' }); return }

    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: { id: true, name: true, username: true, email: true, role: true, createdAt: true },
    })
    res.json({ message: 'User updated', data: user })
  } catch (err) {
    console.error('[updateUser]', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// DELETE /admin/users/:id — soft delete user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } })
    if (!existing) { res.status(404).json({ message: 'User not found' }); return }
    if (existing.role === 'SUPER_ADMIN') { res.status(403).json({ message: 'Cannot delete super admin' }); return }

    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })
    res.json({ message: 'User deleted' })
  } catch (err) {
    console.error('[deleteUser]', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}
