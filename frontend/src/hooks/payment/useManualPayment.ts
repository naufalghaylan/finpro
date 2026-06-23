import { useEffect, useRef, useState, type ChangeEvent, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { uploadManualPaymentProof } from '../../api/order.api'
import { useToast } from '../../components/common/toastContext'
import { getUploadUrl } from '../../components/orders/orderDisplay'
import type { CheckoutOrder } from '../../types/order'
import {
  ALLOWED_PAYMENT_PROOF_TYPES,
  getPaymentErrorMessage,
  MAX_PAYMENT_PROOF_SIZE,
} from './paymentShared'

type UseManualPaymentParams = {
  order: CheckoutOrder | null
  orderId: number
  setOrder: Dispatch<SetStateAction<CheckoutOrder | null>>
}

export function useManualPayment({ order, orderId, setOrder }: UseManualPaymentParams) {
  const [selectedManualChannelCode, setSelectedManualChannelCode] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [hasCopiedManualDestination, setHasCopiedManualDestination] = useState(false)
  const [isPaymentProofExpanded, setIsPaymentProofExpanded] = useState(false)
  const copyResetTimeoutRef = useRef<number | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
    }
  }, [previewUrl])

  const paymentProofUrl = getUploadUrl(order?.paymentProof ?? null)

  const handleCopyPaymentDestination = async (destinationValue: string) => {
    try {
      await navigator.clipboard.writeText(destinationValue)
      setHasCopiedManualDestination(true)
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
      copyResetTimeoutRef.current = window.setTimeout(() => {
        setHasCopiedManualDestination(false)
        copyResetTimeoutRef.current = null
      }, 1800)
      showToast('Nomor tujuan pembayaran berhasil disalin', 'success')
    } catch {
      showToast('Gagal menyalin nomor tujuan pembayaran', 'error')
    }
  }

  const handleManualPaymentChannelChange = (channelCode: string) => {
    setSelectedManualChannelCode(channelCode)
    setHasCopiedManualDestination(false)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!ALLOWED_PAYMENT_PROOF_TYPES.includes(file.type)) {
      setSelectedFile(null)
      event.target.value = ''
      showToast('File harus berupa JPG, JPEG, atau PNG', 'error')
      return
    }

    if (file.size > MAX_PAYMENT_PROOF_SIZE) {
      setSelectedFile(null)
      event.target.value = ''
      showToast('Ukuran bukti bayar maksimal 1MB', 'error')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUploadProof = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!order || !selectedFile || order.status !== 'PENDING_PAYMENT' || !selectedManualChannelCode) return

    setIsUploading(true)
    try {
      const updatedOrder = await uploadManualPaymentProof(orderId, selectedFile)
      setOrder(updatedOrder)
      setSelectedFile(null)
      setIsPaymentProofExpanded(false)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      showToast('Bukti pembayaran berhasil diunggah', 'success')
    } catch (uploadError) {
      showToast(getPaymentErrorMessage(uploadError), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  return {
    selectedManualChannelCode,
    selectedFile,
    previewUrl,
    paymentProofUrl,
    isUploading,
    hasCopiedManualDestination,
    isPaymentProofExpanded,
    setSelectedFile,
    setIsPaymentProofExpanded,
    handleCopyPaymentDestination,
    handleManualPaymentChannelChange,
    handleFileChange,
    handleUploadProof,
  }
}
