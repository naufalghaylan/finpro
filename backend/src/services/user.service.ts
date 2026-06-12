import prisma from '../lib/prisma'
import { AppError } from '../utils/AppError'
import bcrypt from 'bcryptjs'

/**
 * Shared UserService for inter-module communication.
 * Other teams can use this service to easily retrieve user data and profiles.
 */
export class UserService {
  /**
   * Fetch a single user by ID.
   * Useful for other modules that need user details (e.g. Orders, Products).
   * 
   * @param userId The ID of the user to fetch.
   * @param throwOnNotFound Whether to throw an AppError if the user is not found. Default is true.
   */
  static async getUserById(userId: number, throwOnNotFound: boolean = true) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        storeId: true,
        profilePicture: true,
        emailVerified: true,
        createdAt: true,
      }
    })

    if (!user && throwOnNotFound) {
      throw new AppError(404, 'User not found')
    }

    return user
  }

  /**
   * Fetch multiple users by their IDs.
   * Helps avoid N+1 query problems when fetching lists of items (e.g. getting users for a list of reviews).
   * 
   * @param userIds Array of user IDs.
   */
  static async getUsersByIds(userIds: number[]) {
    if (userIds.length === 0) return []

    return await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        storeId: true,
        profilePicture: true,
      }
    })
  }

  /**
   * Fetch a user by Email.
   * 
   * @param email The email of the user to fetch.
   * @param throwOnNotFound Whether to throw an AppError if the user is not found. Default is true.
   */
  static async getUserByEmail(email: string, throwOnNotFound: boolean = true) {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user && throwOnNotFound) {
      throw new AppError(404, 'User not found')
    }

    return user
  }

  /**
   * Check if a user has a specific role.
   * Useful in service layers where request context is not available.
   * 
   * @param userId The user ID to check.
   * @param roles Allowed roles (e.g., ['SUPER_ADMIN', 'STORE_ADMIN'])
   */
  static async hasRole(userId: number, roles: string[]) {
    const user = await this.getUserById(userId, false)
    if (!user) return false
    return roles.includes(user.role)
  }

  static async getStoreAdmins() {
    return await prisma.user.findMany({
      where: { role: 'STORE_ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createStoreAdmin(data: any) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError(400, 'Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'STORE_ADMIN',
        storeId: data.storeId || null,
        emailVerified: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        storeId: true
      }
    });
  }

  static async assignStoreAdmin(adminId: number, storeId: number | null) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'STORE_ADMIN') {
      throw new AppError(404, 'Admin not found or invalid role');
    }

    if (storeId) {
      const store = await prisma.store.findUnique({ where: { id: storeId } });
      if (!store) {
        throw new AppError(404, 'Store not found');
      }
    }

    return await prisma.user.update({
      where: { id: adminId },
      data: { storeId: storeId },
      select: {
        id: true,
        name: true,
        email: true,
        storeId: true
      }
    });
  }
}
