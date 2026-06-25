import { Request, Response, NextFunction } from 'express'
type Role = 'CUSTOMER' | 'SUPER_ADMIN' | 'STORE_ADMIN'

/**
 * Middleware to check if the authenticated user has one of the required roles.
 * Must be used AFTER `authenticate` middleware.
 * 
 * @param roles Array of allowed roles (e.g. [Role.SUPER_ADMIN, Role.STORE_ADMIN])
 */
export const requireRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user

    if (!user) {
      res.status(401).json({ message: 'Unauthorized: User not authenticated' })
      return
    }

    if (!roles.includes(user.role as Role)) {
      res.status(403).json({ message: `Forbidden: Requires one of the following roles: ${roles.join(', ')}` })
      return
    }

    next()
  }
}

/**
 * Middleware strictly for SUPER_ADMIN role.
 * Usage: router.post('/some-route', authenticate, requireSuperAdmin, controller)
 */
export const requireSuperAdmin = requireRole(['SUPER_ADMIN' as Role])

/**
 * Middleware strictly for STORE_ADMIN role.
 * Usage: router.post('/some-route', authenticate, requireStoreAdmin, controller)
 */
export const requireStoreAdmin = requireRole(['STORE_ADMIN' as Role])

/**
 * Middleware for both SUPER_ADMIN and STORE_ADMIN.
 * Useful for routes that can be accessed by any type of admin.
 */
export const requireAdmin = requireRole(['SUPER_ADMIN' as Role, 'STORE_ADMIN' as Role])
