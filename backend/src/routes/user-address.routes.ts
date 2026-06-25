import { Router } from 'express'
import * as addressController from '../controllers/user-address.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', addressController.getAddresses)
router.get('/:id', addressController.getAddressById)
router.post('/', addressController.createAddress)
router.put('/:id', addressController.updateAddress)
router.delete('/:id', addressController.deleteAddress)
router.put('/:id/primary', addressController.setPrimaryAddress)

export default router
