import { Request, Response } from 'express'
import cloudinary from '../lib/cloudinary'
import {
  confirmManualPayment as confirmManualPaymentService,
  createMidtransSnapToken as createMidtransSnapTokenService,
  getOrderPaymentDetails as getOrderPaymentDetailsService,
  syncMidtransPaymentStatus as syncMidtransPaymentStatusService,
  uploadManualPaymentProof as uploadManualPaymentProofService,
} from '../services/order.service'
import {
  confirmManualPaymentSchema,
  orderParamsSchema,
} from '../validations/order.validation'
import {
  getAuthenticatedUserId,
  sendInternalError,
  sendValidationError,
} from './controller.utils'
import { handleOrderError } from './order-error.util'

const uploadPaymentProofToCloudinary = async (file: Express.Multer.File) => {
  const base64File = Buffer.from(file.buffer).toString('base64')
  const dataUri = `data:${file.mimetype};base64,${base64File}`

  return cloudinary.uploader.upload(dataUri, {
    folder: 'finpro/payment-proofs',
    resource_type: 'image',
  })
}

const removeCloudinaryAsset = async (publicId?: string) => {
  if (!publicId) return

  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('[removeCloudinaryAsset]', error)
  }
}

export const getOrderPaymentDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)

    if (!parsedParams.success) {
      sendValidationError(res, parsedParams.error)
      return
    }

    const order = await getOrderPaymentDetailsService({
      userId,
      orderId: parsedParams.data.id,
    })

    res.json({
      data: order,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'getOrderPaymentDetails', error)
  }
}

export const uploadManualPaymentProof = async (req: Request, res: Response): Promise<void> => {
  let uploadedPaymentProofPublicId: string | undefined

  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) {
      return
    }

    const parsedParams = orderParamsSchema.safeParse(req.params)

    if (!parsedParams.success) {
      sendValidationError(res, parsedParams.error)
      return
    }

    if (!req.file) {
      res.status(400).json({
        message: 'Payment proof file is required',
        code: 'PAYMENT_PROOF_REQUIRED',
      })
      return
    }

    const uploadResult = await uploadPaymentProofToCloudinary(req.file)
    uploadedPaymentProofPublicId = uploadResult.public_id

    const order = await uploadManualPaymentProofService({
      userId,
      orderId: parsedParams.data.id,
      paymentProofUrl: uploadResult.secure_url,
    })

    uploadedPaymentProofPublicId = undefined

    res.json({
      message: 'Payment proof uploaded successfully',
      data: order,
    })
  } catch (error) {
    await removeCloudinaryAsset(uploadedPaymentProofPublicId)
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'uploadManualPaymentProof', error)
  }
}

export const createMidtransPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)

    if (!parsedParams.success) {
      sendValidationError(res, parsedParams.error)
      return
    }

    const result = await createMidtransSnapTokenService({
      userId,
      orderId: parsedParams.data.id,
    })

    res.json({
      message: 'Midtrans payment token created',
      data: result,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'createMidtransPayment', error)
  }
}

export const syncMidtransPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)

    if (!parsedParams.success) {
      sendValidationError(res, parsedParams.error)
      return
    }

    const order = await syncMidtransPaymentStatusService({
      userId,
      orderId: parsedParams.data.id,
    })

    res.json({
      message: 'Midtrans payment status synced',
      data: order,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'syncMidtransPaymentStatus', error)
  }
}

export const confirmManualPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)
    const parsedBody = confirmManualPaymentSchema.safeParse(req.body)

    if (!parsedParams.success) {
      sendValidationError(res, parsedParams.error)
      return
    }

    if (!parsedBody.success) {
      sendValidationError(res, parsedBody.error)
      return
    }

    const order = await confirmManualPaymentService({
      userId,
      orderId: parsedParams.data.id,
      action: parsedBody.data.action,
    })

    res.json({
      message: parsedBody.data.action === 'approve'
        ? 'Manual payment approved successfully'
        : 'Manual payment rejected successfully',
      data: order,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    sendInternalError(res, 'confirmManualPayment', error)
  }
}
