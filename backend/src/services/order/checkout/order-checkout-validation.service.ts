import type { UserAddress } from '../../../generated/prisma/client'
import prisma from '../../../lib/prisma'
import { getDistanceFromLatLonInKm } from '../../../utils/geo.util'
import { ORDER_ERRORS, OrderServiceError } from '../../order.errors'
import type { DatabaseClient } from '../core/order.types'

export const getNearestActiveStore = async (latitude: number, longitude: number, db: DatabaseClient = prisma) => {
  const stores = await db.store.findMany({
    where: { status: true, deletedAt: null },
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
  })

  if (stores.length === 0) {
    throw new OrderServiceError(ORDER_ERRORS.STORE_NOT_FOUND, 'No active store available', 404)
  }

  const storesWithDistance = stores.map((store) => {
    const distance = getDistanceFromLatLonInKm(latitude, longitude, store.latitude, store.longitude)

    return {
      ...store,
      distance: Number(distance.toFixed(2)),
      isOutOfRange: distance > store.serviceRadius,
    }
  })

  return storesWithDistance.sort((firstStore, secondStore) => firstStore.distance - secondStore.distance)[0]
}

export const getUserAddresses = async (userId: number) => {
  return prisma.userAddress.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
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
      createdAt: true,
      updatedAt: true,
    },
  })
}

export const getAddressCoordinates = (address: Pick<UserAddress, 'latitude' | 'longitude'>) => {
  if (address.latitude === null || address.longitude === null) {
    throw new OrderServiceError(
      ORDER_ERRORS.ADDRESS_COORDINATE_REQUIRED,
      'Selected address must have latitude and longitude',
      400,
    )
  }

  return {
    latitude: address.latitude,
    longitude: address.longitude,
  }
}

export const getCheckoutCart = async (userId: number, db: DatabaseClient) => {
  const cart = await db.cart.findUnique({
    where: { userId },
    select: {
      id: true,
      items: {
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          productId: true,
          quantity: true,
          product: {
            select: {
              id: true,
              name: true,
              basePrice: true,
            },
          },
        },
      },
    },
  })

  if (!cart || cart.items.length === 0) {
    throw new OrderServiceError(ORDER_ERRORS.EMPTY_CART, 'Cart is empty', 400)
  }

  return cart
}

const getOrderNumberDatePart = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

export const generateOrderNumber = async (userId: number, db: DatabaseClient) => {
  const datePart = getOrderNumberDatePart(new Date())

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
    const orderNumber = `ORD-${datePart}-${userId}-${suffix}`
    const existingOrder = await db.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    })

    if (!existingOrder) {
      return orderNumber
    }
  }

  throw new OrderServiceError(
    ORDER_ERRORS.ORDER_NUMBER_FAILED,
    'Failed to generate unique order number',
    500,
  )
}
