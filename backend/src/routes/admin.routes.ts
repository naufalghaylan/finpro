import { Router } from 'express'
import { listUsers, createStoreAdmin, updateUser, deleteUser } from '../controllers/admin.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const adminRouter = Router()

adminRouter.use(authenticate, authorize('SUPER_ADMIN'))

adminRouter.get('/users', listUsers)
adminRouter.post('/users', createStoreAdmin)
adminRouter.put('/users/:id', updateUser)
adminRouter.delete('/users/:id', deleteUser)

export default adminRouter
