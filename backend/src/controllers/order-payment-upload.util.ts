import cloudinary from '../lib/cloudinary'

export const uploadPaymentProofToCloudinary = async (file: Express.Multer.File) => {
  const base64File = Buffer.from(file.buffer).toString('base64')
  const dataUri = `data:${file.mimetype};base64,${base64File}`

  return cloudinary.uploader.upload(dataUri, {
    folder: 'finpro/payment-proofs',
    resource_type: 'image',
  })
}

export const removeCloudinaryAsset = async (publicId?: string) => {
  if (!publicId) return

  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('[removeCloudinaryAsset]', error)
  }
}