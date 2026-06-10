import fs from 'fs'
import path from 'path'
import { NextFunction, Request, Response } from 'express'
import multer from 'multer'

const PAYMENT_PROOF_MAX_SIZE = 1 * 1024 * 1024
const uploadDir = path.join(__dirname, '../../../uploads/payment-proofs')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const safeSuffix = Math.random().toString(36).slice(2, 10)

    callback(null, `payment-proof-${Date.now()}-${safeSuffix}${extension}`)
  },
})

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png'])
const allowedMimeTypes = new Set(['image/jpeg', 'image/png'])

const paymentProofUpload = multer({
  storage,
  limits: {
    fileSize: PAYMENT_PROOF_MAX_SIZE,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()

    if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
      callback(new Error('File bukti bayar harus berupa JPG, JPEG, atau PNG'))
      return
    }

    callback(null, true)
  },
}).single('paymentProof')

export const handlePaymentProofUpload = (req: Request, res: Response, next: NextFunction) => {
  paymentProofUpload(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        message: 'Ukuran bukti bayar maksimal 1MB',
        code: 'PAYMENT_PROOF_TOO_LARGE',
      })
      return
    }

    res.status(400).json({
      message: error instanceof Error ? error.message : 'File bukti bayar tidak valid',
      code: 'PAYMENT_PROOF_INVALID_FILE',
    })
  })
}
