import { Request, Response } from 'express'
import * as addressService from '../services/user-address.service'
import { createUserAddressSchema, updateUserAddressSchema } from '../validations/user-address.validation'
import { AppError } from '../utils/AppError'

const handleError = (res: Response, err: unknown, context: string) => {
  if (err instanceof AppError) return res.status(err.statusCode).json({ message: err.message })
  if (err instanceof Error && err.name === 'ZodError') {
    return res.status(400).json({ message: 'Validation failed', errors: JSON.parse(err.message) })
  }
  console.error(`[${context}]`, err)
  res.status(500).json({ message: 'Internal server error' })
}

export const getAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const addresses = await addressService.getUserAddressesService(req.user!.userId)
    res.json({ message: 'Addresses fetched successfully', data: addresses })
  } catch (err) { handleError(res, err, 'getAddresses') }
}

export const getAddressById = async (req: Request, res: Response): Promise<void> => {
  try {
    const addressId = parseInt(req.params.id as string)
    if (isNaN(addressId)) throw new AppError(400, 'Invalid address ID')
    const address = await addressService.getAddressByIdService(req.user!.userId, addressId)
    res.json({ message: 'Address fetched successfully', data: address })
  } catch (err) { handleError(res, err, 'getAddressById') }
}

export const createAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createUserAddressSchema.parse(req.body)
    const address = await addressService.createUserAddressService(req.user!.userId, parsed)
    res.status(201).json({ message: 'Address created successfully', data: address })
  } catch (err) { handleError(res, err, 'createAddress') }
}

export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const addressId = parseInt(req.params.id as string)
    if (isNaN(addressId)) throw new AppError(400, 'Invalid address ID')
    const parsed = updateUserAddressSchema.parse(req.body)
    const address = await addressService.updateUserAddressService(req.user!.userId, addressId, parsed)
    res.json({ message: 'Address updated successfully', data: address })
  } catch (err) { handleError(res, err, 'updateAddress') }
}

export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const addressId = parseInt(req.params.id as string)
    if (isNaN(addressId)) throw new AppError(400, 'Invalid address ID')
    await addressService.deleteUserAddressService(req.user!.userId, addressId)
    res.json({ message: 'Address deleted successfully' })
  } catch (err) { handleError(res, err, 'deleteAddress') }
}

export const setPrimaryAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const addressId = parseInt(req.params.id as string)
    if (isNaN(addressId)) throw new AppError(400, 'Invalid address ID')
    const address = await addressService.setPrimaryAddressService(req.user!.userId, addressId)
    res.json({ message: 'Primary address updated successfully', data: address })
  } catch (err) { handleError(res, err, 'setPrimaryAddress') }
}
