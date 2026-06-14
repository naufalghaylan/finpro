const midtransClient = require('midtrans-client')

type MidtransSnapClient = {
  createTransaction: (parameter: Record<string, unknown>) => Promise<{
    token: string
    redirect_url: string
  }>
}

type MidtransCoreClient = {
  transaction: {
    status: (transactionId: string) => Promise<{
      order_id: string
      transaction_status: string
      fraud_status?: string
      payment_type?: string
      transaction_id?: string
    }>
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

const createSnapClient = (): MidtransSnapClient =>
  new midtransClient.Snap({ isProduction: isProduction(), serverKey: getServerKey() })

const createCoreClient = (): MidtransCoreClient =>
  new midtransClient.CoreApi({ isProduction: isProduction(), serverKey: getServerKey() })

export const midtransSnap: MidtransSnapClient = new Proxy({} as MidtransSnapClient, {
  get: (_, prop) => createSnapClient()[prop as keyof MidtransSnapClient],
})

export const midtransCore: MidtransCoreClient = new Proxy({} as MidtransCoreClient, {
  get: (_, prop) => createCoreClient()[prop as keyof MidtransCoreClient],
})
