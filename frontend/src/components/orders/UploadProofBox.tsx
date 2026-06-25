import type { ChangeEvent, FormEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileImage,
  Loader2,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { formatDateTime } from './orderDisplay'
import type { CheckoutOrder } from '../../types/order'
import type { ManualPaymentChannel } from './manualPaymentChannels'

type UploadProofBoxProps = {
  order: CheckoutOrder
  selectedChannel: ManualPaymentChannel | null
  selectedFile: File | null
  previewUrl: string | null
  paymentProofUrl: string
  remainingSeconds: number
  isUploading: boolean
  isProofExpanded: boolean
  hasUploadedProof: boolean
  isPaymentExpired: boolean
  canUploadProof: boolean
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onUploadProof: (event: FormEvent<HTMLFormElement>) => void
  onToggleProofExpanded: () => void
}

const formatRemainingTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const nextSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(nextSeconds).padStart(2, '0')}`
}

const getUploadedProofMessage = (status: CheckoutOrder['status']) => {
  if (status === 'WAITING_CONFIRMATION') {
    return 'Pesanan sedang menunggu konfirmasi pembayaran dari admin.'
  }

  if (status === 'PROCESSING') {
    return 'Pembayaran sudah diverifikasi. Pesanan sedang diproses oleh cabang PanenMart.'
  }

  if (status === 'SHIPPED') {
    return 'Pembayaran sudah diverifikasi. Pesanan sedang dalam pengiriman.'
  }

  if (status === 'CONFIRMED') {
    return 'Pembayaran sudah diverifikasi dan pesanan sudah selesai.'
  }

  if (status === 'CANCELLED') {
    return 'Pesanan sudah dibatalkan. Bukti bayar tersimpan sebagai arsip transaksi.'
  }

  return 'Bukti pembayaran sudah tersimpan pada pesanan ini.'
}

const getNoProofCopy = (order: CheckoutOrder) => {
  if (order.status === 'CANCELLED') {
    return {
      title: 'Pembayaran tidak dilanjutkan',
      description: order.cancelReason
        ? `Pesanan dibatalkan dengan alasan: ${order.cancelReason}`
        : 'Pesanan sudah dibatalkan sebelum bukti bayar diunggah.',
      Icon: XCircle,
    }
  }

  return {
    title: 'Bukti bayar tidak diperlukan',
    description: 'Pesanan tidak berada pada tahap unggah bukti bayar, sehingga tidak ada tindakan pembayaran manual yang diperlukan.',
    Icon: AlertCircle,
  }
}

export function UploadProofBox({
  order,
  selectedChannel,
  selectedFile,
  previewUrl,
  paymentProofUrl,
  remainingSeconds,
  isUploading,
  isProofExpanded,
  hasUploadedProof,
  isPaymentExpired,
  canUploadProof,
  onFileChange,
  onUploadProof,
  onToggleProofExpanded,
}: UploadProofBoxProps) {
  const isVerifiedPaymentStatus = (
    order.status === 'PROCESSING' ||
    order.status === 'SHIPPED' ||
    order.status === 'CONFIRMED'
  )
  const uploadedProofMessage = getUploadedProofMessage(order.status)
  const shouldShowUploadForm = order.status === 'PENDING_PAYMENT' && !hasUploadedProof
  const noProofCopy = getNoProofCopy(order)
  const NoProofIcon = noProofCopy.Icon

  return (
    <>
      {order.status === 'PENDING_PAYMENT' && (
        <div className={`payment-deadline-card ${isPaymentExpired ? 'expired' : ''}`}>
          <Clock3 aria-hidden="true" />
          <div>
            <span>Batas unggah bukti bayar</span>
            <strong>{formatDateTime(order.paymentDeadline)}</strong>
            <em>{isPaymentExpired ? 'Waktu unggah sudah habis' : `${formatRemainingTime(remainingSeconds)} tersisa`}</em>
          </div>
        </div>
      )}

      {hasUploadedProof ? (
        <div className={`payment-proof-result ${isVerifiedPaymentStatus ? 'payment-proof-result--verified' : ''}`}>
          <CheckCircle2 aria-hidden="true" />
          <div className="payment-proof-result-content">
            <h3>Bukti bayar sudah diterima</h3>
            <p>{uploadedProofMessage}</p>
            {paymentProofUrl && (
              <>
                <button
                  type="button"
                  className="payment-proof-toggle"
                  aria-expanded={isProofExpanded}
                  onClick={onToggleProofExpanded}
                >
                  {isProofExpanded ? (
                    <>
                      <ChevronUp className="button-icon" aria-hidden="true" />
                      Sembunyikan bukti bayar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="button-icon" aria-hidden="true" />
                      Lihat bukti bayar
                    </>
                  )}
                </button>

                {isProofExpanded && (
                  <div className="payment-proof-preview payment-proof-preview--uploaded">
                    <img src={paymentProofUrl} alt="Bukti pembayaran pesanan" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : shouldShowUploadForm ? (
        <form className="payment-upload-form" onSubmit={onUploadProof}>
          <label className="payment-upload-dropzone">
            <UploadCloud aria-hidden="true" />
            <strong>
              {selectedFile
                ? selectedFile.name
                : selectedChannel
                  ? 'Pilih file bukti bayar'
                  : 'Pilih bank tujuan dulu'}
            </strong>
            <span>
              {selectedChannel
                ? 'Format JPG, JPEG, atau PNG. Maksimal 1MB.'
                : 'Unggah bukti baru bisa dilakukan setelah detail rekening muncul.'}
            </span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              disabled={!selectedChannel || isPaymentExpired || isUploading}
              onChange={onFileChange}
            />
          </label>

          {previewUrl && (
            <div className="payment-proof-preview">
              <img src={previewUrl} alt="Preview bukti bayar" />
            </div>
          )}

          {isPaymentExpired && (
            <div className="checkout-inline-alert">
              <AlertCircle aria-hidden="true" />
              Batas unggah sudah berakhir. Pesanan akan dibatalkan otomatis oleh sistem.
            </div>
          )}

          <button type="submit" className="button primary payment-upload-button" disabled={!canUploadProof}>
            {isUploading ? (
              <>
                <Loader2 className="button-icon spin" aria-hidden="true" />
                Mengunggah...
              </>
            ) : (
              <>
                <FileImage className="button-icon" aria-hidden="true" />
                Unggah Bukti Bayar
              </>
            )}
          </button>
        </form>
      ) : (
        <div className={`payment-proof-result ${order.status === 'CANCELLED' ? 'payment-proof-result--cancelled' : ''}`}>
          <NoProofIcon aria-hidden="true" />
          <div className="payment-proof-result-content">
            <h3>{noProofCopy.title}</h3>
            <p>{noProofCopy.description}</p>
          </div>
        </div>
      )}
    </>
  )
}