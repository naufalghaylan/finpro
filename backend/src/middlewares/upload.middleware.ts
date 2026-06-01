import multer from 'multer'
import { AppError } from '../utils/AppError'

const storage = multer.memoryStorage()

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  
  if (allowedExtensions.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError(400, 'Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed.'))
  }
}

export const uploadProfilePicture = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB strictly
  }
})
