import prisma from '../lib/prisma'
import { AppError } from '../utils/AppError'
import { Prisma } from '../generated/prisma/client'

export const getUserAddressesService = async (userId: number) => {
  return await prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }]
  })
}

export const getAddressByIdService = async (userId: number, addressId: number) => {
  const address = await prisma.userAddress.findFirst({
    where: { id: addressId, userId }
  })
  if (!address) throw new AppError(404, 'Address not found')
  return address
}

export const createUserAddressService = async (userId: number, data: any) => {
  return await prisma.$transaction(async (tx) => {
    // If this is the first address, force it to be primary
    const addressCount = await tx.userAddress.count({ where: { userId } })
    if (addressCount === 0) {
      data.isPrimary = true
    }

    if (data.isPrimary) {
      // Unset primary for all other addresses
      await tx.userAddress.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false }
      })
    }

    return await tx.userAddress.create({
      data: {
        ...data,
        userId
      }
    })
  })
}

export const updateUserAddressService = async (userId: number, addressId: number, data: any) => {
  return await prisma.$transaction(async (tx) => {
    const address = await tx.userAddress.findFirst({
      where: { id: addressId, userId }
    })
    if (!address) throw new AppError(404, 'Address not found')

    if (data.isPrimary) {
      // Unset primary for all other addresses
      await tx.userAddress.updateMany({
        where: { userId, isPrimary: true, id: { not: addressId } },
        data: { isPrimary: false }
      })
    } else if (data.isPrimary === false && address.isPrimary) {
      // Check if there are other addresses
      const otherAddressCount = await tx.userAddress.count({
        where: { userId, id: { not: addressId } }
      })
      if (otherAddressCount === 0) {
        throw new AppError(400, 'Cannot unset the only address as primary')
      }
      // Pick another address to be primary if we unset this one
      const anotherAddress = await tx.userAddress.findFirst({
        where: { userId, id: { not: addressId } },
        orderBy: { updatedAt: 'desc' }
      })
      if (anotherAddress) {
        await tx.userAddress.update({
          where: { id: anotherAddress.id },
          data: { isPrimary: true }
        })
      }
    }

    return await tx.userAddress.update({
      where: { id: addressId },
      data
    })
  })
}

export const deleteUserAddressService = async (userId: number, addressId: number) => {
  return await prisma.$transaction(async (tx) => {
    const address = await tx.userAddress.findFirst({
      where: { id: addressId, userId }
    })
    if (!address) throw new AppError(404, 'Address not found')

    if (address.isPrimary) {
      const anotherAddress = await tx.userAddress.findFirst({
        where: { userId, id: { not: addressId } },
        orderBy: { updatedAt: 'desc' }
      })
      if (anotherAddress) {
        await tx.userAddress.update({
          where: { id: anotherAddress.id },
          data: { isPrimary: true }
        })
      }
    }

    await tx.userAddress.delete({
      where: { id: addressId }
    })
    return { message: 'Address deleted successfully' }
  })
}

export const setPrimaryAddressService = async (userId: number, addressId: number) => {
  return await prisma.$transaction(async (tx) => {
    const address = await tx.userAddress.findFirst({
      where: { id: addressId, userId }
    })
    if (!address) throw new AppError(404, 'Address not found')

    if (address.isPrimary) return address

    await tx.userAddress.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false }
    })

    return await tx.userAddress.update({
      where: { id: addressId },
      data: { isPrimary: true }
    })
  })
}
