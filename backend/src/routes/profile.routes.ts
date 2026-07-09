import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { uploadProfilePicture } from '../middlewares/upload.middleware'
import * as profileController from '../controllers/profile.controller'

const router = Router()

// Public route for verifying email change from email link
router.post('/verify-email-change', profileController.verifyEmailChange)

router.use(authenticate)

router.get('/', profileController.getProfile)
router.put('/', uploadProfilePicture.single('profilePicture'), profileController.updateProfile)
router.put('/email', profileController.updateEmail)
router.post('/reverify-email', profileController.reverifyEmail)

export default router
