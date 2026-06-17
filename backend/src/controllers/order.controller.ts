import { Request, Response } from 'express'
import cloudinary from '../lib/cloudinary'
import {
  approveFulfillment as approveFulfillmentService,
  cancelOrder as cancelOrderService,
  confirmOrderReceived as confirmOrderReceivedService,
  confirmManualPayment as confirmManualPaymentService,
  createCheckoutOrder as createCheckoutOrderService,
  createMidtransSnapToken as createMidtransSnapTokenService,
  getOrderPaymentDetails as getOrderPaymentDetailsService,
  getCheckoutPreview as getCheckoutPreviewService,
  listAdminOrders as listAdminOrdersService,
  OrderServiceError,
  listOrders as listOrdersService,
  receiveFulfillment as receiveFulfillmentService,
  rejectFulfillment as rejectFulfillmentService,
  requestOrderFulfillment as requestOrderFulfillmentService,
  shipOrder as shipOrderService,
  syncMidtransPaymentStatus as syncMidtransPaymentStatusService,
  uploadManualPaymentProof as uploadManualPaymentProofService,
} from '../services/order.service'
import {
  adminOrderListQuerySchema,
  cancelOrderSchema,
  checkoutQuerySchema,
  confirmManualPaymentSchema,
  createCheckoutOrderSchema,
  fulfillmentActionSchema,
  orderListQuerySchema,
  orderParamsSchema,
  requestFulfillmentSchema,
  stockMutationParamsSchema,
} from '../validations/order.validation'

const getAuthenticatedUserId = (req: Request, res: Response) => {
  const userId = req.user?.userId

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: Login required' })
    return null
  }

  return userId
}

const handleOrderError = (error: unknown, res: Response) => {
  if (error instanceof OrderServiceError) {
    res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      details: error.details,
    })
    return true
  }

  return false
}

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

export const listOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsed = orderListQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsed.error.flatten().fieldErrors })
      return
    }

    const result = await listOrdersService({
      userId,
      ...parsed.data,
    })

    res.json(result)
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[listOrders]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const listAdminOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized: Login required' })
      return
    }

    const parsed = adminOrderListQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsed.error.flatten().fieldErrors })
      return
    }

    const result = await listAdminOrdersService({
      actorRole: user.role,
      actorStoreId: user.storeId,
      ...parsed.data,
    })

    res.json(result)
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[listAdminOrders]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getCheckoutPreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsed = checkoutQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsed.error.flatten().fieldErrors })
      return
    }

    const preview = await getCheckoutPreviewService({
      userId,
      addressId: parsed.data.addressId,
    })

    res.json({
      data: preview,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[getCheckoutPreview]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const createCheckoutOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsed = createCheckoutOrderSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsed.error.flatten().fieldErrors })
      return
    }

    const result = await createCheckoutOrderService({
      userId,
      addressId: parsed.data.addressId,
      shippingMethod: parsed.data.shippingMethod,
      shippingService: parsed.data.shippingService,
      shippingCost: parsed.data.shippingCost,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes,
    })

    res.status(201).json({
      message: 'Order created successfully',
      data: result,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[createCheckoutOrder]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getOrderPaymentDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)

    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
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

    console.error('[getOrderPaymentDetails]', error)
    res.status(500).json({ message: 'Internal server error' })
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
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
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

    console.error('[uploadManualPaymentProof]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const createMidtransPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)

    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
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

    console.error('[createMidtransPayment]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const syncMidtransPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)

    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
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

    console.error('[syncMidtransPaymentStatus]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const confirmManualPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)
    const parsedBody = confirmManualPaymentSchema.safeParse(req.body)

    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
      return
    }

    if (!parsedBody.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedBody.error.flatten().fieldErrors })
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

    console.error('[confirmManualPayment]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)
    const parsedBody = cancelOrderSchema.safeParse(req.body)

    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
      return
    }

    if (!parsedBody.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedBody.error.flatten().fieldErrors })
      return
    }

    const order = await cancelOrderService({
      userId,
      orderId: parsedParams.data.id,
      reason: parsedBody.data.reason,
    })

    res.json({
      message: 'Order cancelled and stock restored',
      data: order,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[cancelOrder]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const adminCancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)
    const parsedBody = cancelOrderSchema.safeParse(req.body)

    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
      return
    }

    if (!parsedBody.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedBody.error.flatten().fieldErrors })
      return
    }

    const order = await cancelOrderService({
      userId,
      orderId: parsedParams.data.id,
      reason: parsedBody.data.reason,
      isAdmin: true,
    })

    res.json({
      message: 'Order cancelled and stock restored',
      data: order,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[adminCancelOrder]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const shipOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)

    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
      return
    }

    const order = await shipOrderService({
      userId,
      orderId: parsedParams.data.id,
    })

    res.json({
      message: 'Order marked as shipped',
      data: order,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[shipOrder]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const confirmOrderReceived = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)

    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
      return
    }

    const order = await confirmOrderReceivedService({
      userId,
      orderId: parsedParams.data.id,
    })

    res.json({
      message: 'Order received successfully',
      data: order,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[confirmOrderReceived]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const requestOrderFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = orderParamsSchema.safeParse(req.params)
    const parsedBody = requestFulfillmentSchema.safeParse(req.body)

    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
      return
    }

    if (!parsedBody.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedBody.error.flatten().fieldErrors })
      return
    }

    const mutation = await requestOrderFulfillmentService({
      userId,
      orderId: parsedParams.data.id,
      sourceStoreId: parsedBody.data.sourceStoreId,
      productId: parsedBody.data.productId,
      quantity: parsedBody.data.quantity,
      notes: parsedBody.data.notes,
    })

    res.status(201).json({
      message: 'Fulfillment request created',
      data: mutation,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[requestOrderFulfillment]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const handleFulfillmentAction = async (
  req: Request,
  res: Response,
  action: 'approve' | 'receive' | 'reject',
) => {
  const userId = getAuthenticatedUserId(req, res)
  if (!userId) return

  const parsedParams = stockMutationParamsSchema.safeParse(req.params)
  const parsedBody = fulfillmentActionSchema.safeParse(req.body)

  if (!parsedParams.success) {
    res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
    return
  }

  if (!parsedBody.success) {
    res.status(400).json({ message: 'Validation Error', errors: parsedBody.error.flatten().fieldErrors })
    return
  }

  const payload = {
    userId,
    mutationId: parsedParams.data.mutationId,
    notes: parsedBody.data.notes,
  }

  if (action === 'approve') {
    return approveFulfillmentService(payload)
  }

  if (action === 'receive') {
    return receiveFulfillmentService(payload)
  }

  return rejectFulfillmentService(payload)
}

export const approveFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const mutation = await handleFulfillmentAction(req, res, 'approve')
    if (!mutation) return

    res.json({
      message: 'Fulfillment approved and stock sent',
      data: mutation,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[approveFulfillment]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const receiveFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const mutation = await handleFulfillmentAction(req, res, 'receive')
    if (!mutation) return

    res.json({
      message: 'Fulfillment received',
      data: mutation,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[receiveFulfillment]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const rejectFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const mutation = await handleFulfillmentAction(req, res, 'reject')
    if (!mutation) return

    res.json({
      message: 'Fulfillment rejected',
      data: mutation,
    })
  } catch (error) {
    if (handleOrderError(error, res)) return

    console.error('[rejectFulfillment]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
