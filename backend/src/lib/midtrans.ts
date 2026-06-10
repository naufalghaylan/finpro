const midtransClient = require('midtrans-client')

type MidtransSnapClient = {
  createTransaction: (parameter: Record<string, unknown>) => Promise<{
    token: string
    redirect_url: string
  }>
}

type MidtransCoreClient = {
  transaction: {
    notification: (payload: unknown) => Promise<{
      order_id: string
      transaction_status: string
      fraud_status?: string
      payment_type?: string
      transaction_id?: string
    }>
  }
}

const getServerKey = () => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY

  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is not configured')
  }

  return serverKey
}

const isProduction = () => process.env.MIDTRANS_IS_PRODUCTION === 'true'

export const midtransSnap = new midtransClient.Snap({
  isProduction: isProduction(),
  serverKey: getServerKey(),
}) as MidtransSnapClient

export const midtransCore = new midtransClient.CoreApi({
  isProduction: isProduction(),
  serverKey: getServerKey(),
}) as MidtransCoreClient
