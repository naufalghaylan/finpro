import { NextFunction, Request, Response } from 'express'
import multer from 'multer'

const PAYMENT_PROOF_MAX_SIZE = 1 * 1024 * 1024
const allowedMimeTypes = new Set(['image/jpeg', 'image/png'])

const paymentProofUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: PAYMENT_PROOF_MAX_SIZE,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
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
