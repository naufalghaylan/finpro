import prisma from '../lib/prisma'
import { AppError } from '../utils/AppError'

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
}
