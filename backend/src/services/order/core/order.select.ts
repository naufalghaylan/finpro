import type { Prisma } from '../../../generated/prisma/client'

export const orderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  totalProductAmount: true,
  totalAmount: true,
  shippingCost: true,
  discountAmount: true,
  voucher: {
    select: {
      id: true,
      code: true,
      name: true,
      productId: true,
      source: true,
      discountType: true,
      discountValue: true,
      maxDiscount: true,
      minPurchase: true,
      applicableTo: true,
      expiredAt: true,
    },
  },
  paymentMethod: true,
  paymentProof: true,
  paymentGatewayId: true,
  paymentDeadline: true,
  shippedAt: true,
  confirmedAt: true,
  cancelledAt: true,
  cancelReason: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  store: {
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      province: true,
      latitude: true,
      longitude: true,
      serviceRadius: true,
    },
  },
  address: {
    select: {
      id: true,
      recipientName: true,
      phone: true,
      address: true,
      city: true,
      province: true,
      district: true,
      postalCode: true,
      latitude: true,
      longitude: true,
      isPrimary: true,
    },
  },
  items: {
    select: {
      id: true,
      quantity: true,
      priceAtTime: true,
      subtotal: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            select: {
              id: true,
              imageUrl: true,
              isPrimary: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.OrderSelect

export const adminOrderSelect = {
  ...orderSelect,
  shippingMethod: true,
  shippingService: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  stockMutations: {
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderId: true,
      sourceStoreId: true,
      destinationStoreId: true,
      productId: true,
      quantity: true,
      status: true,
      notes: true,
      approvedAt: true,
      rejectedAt: true,
      sentAt: true,
      receivedAt: true,
      createdAt: true,
      updatedAt: true,
      sourceStore: {
        select: {
          id: true,
          name: true,
        },
      },
      destinationStore: {
        select: {
          id: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.OrderSelect
