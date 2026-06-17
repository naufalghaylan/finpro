import type { CheckoutOrder } from '../../types/order'
import { getApiErrorMessage } from '../../utils/apiError'

type MidtransSnapCallbacks = {
  onSuccess?: (result: unknown) => void
  onPending?: (result: unknown) => void
  onError?: (result: unknown) => void
  onClose?: () => void
}

declare global {
  interface Window {
    snap?: {
      embed: (token: string, callbacks: MidtransSnapCallbacks & { embedId: string }) => void
      hide?: () => void
    }
  }
}

export type PaymentSyncMode = 'silent' | 'success' | 'pending' | 'return'

export const MAX_PAYMENT_PROOF_SIZE = 1 * 1024 * 1024
export const ALLOWED_PAYMENT_PROOF_TYPES = ['image/jpeg', 'image/png']
export const MIDTRANS_STATUS_POLL_INTERVAL_MS = 5000

const MIDTRANS_SNAP_SCRIPT_ID = 'midtrans-snap-script'
const MIDTRANS_SNAP_SCRIPT_URL = 'https://app.sandbox.midtrans.com/snap/snap.js'

export const getPaymentErrorMessage = (error: unknown) =>
  getApiErrorMessage(error, 'Gagal memproses pembayaran')

export const getRemainingPaymentSeconds = (deadline: string | null) => {
  if (!deadline) return 0
  return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
}

export const hasOrderChanged = (currentOrder: CheckoutOrder | null, nextOrder: CheckoutOrder) => {
  if (!currentOrder) return true

  return (
    currentOrder.id !== nextOrder.id ||
    currentOrder.status !== nextOrder.status ||
    currentOrder.updatedAt !== nextOrder.updatedAt ||
    currentOrder.paymentProof !== nextOrder.paymentProof ||
    currentOrder.paymentGatewayId !== nextOrder.paymentGatewayId ||
    currentOrder.paymentDeadline !== nextOrder.paymentDeadline ||
    currentOrder.shippedAt !== nextOrder.shippedAt ||
    currentOrder.confirmedAt !== nextOrder.confirmedAt ||
    currentOrder.cancelledAt !== nextOrder.cancelledAt ||
    currentOrder.cancelReason !== nextOrder.cancelReason
  )
}

export const loadMidtransSnapScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.snap) {
      resolve()
      return
    }

    const existingScript = document.getElementById(MIDTRANS_SNAP_SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Gagal memuat Midtrans Snap')), { once: true })
      return
    }

    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY
    if (!clientKey) {
      reject(new Error('VITE_MIDTRANS_CLIENT_KEY belum diisi'))
      return
    }

    const script = document.createElement('script')
    script.id = MIDTRANS_SNAP_SCRIPT_ID
    script.src = MIDTRANS_SNAP_SCRIPT_URL
    script.setAttribute('data-client-key', clientKey)
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap'))
    document.body.appendChild(script)
  })
