import type { ChangeEvent, FormEvent } from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Clock3, FileImage, Loader2, UploadCloud } from 'lucide-react'
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
  return (
    <>
      {order.status === 'PENDING_PAYMENT' && (
        <div className={`payment-deadline-card ${isPaymentExpired ? 'expired' : ''}`}>
          <Clock3 aria-hidden="true" />
          <div>
            <span>Deadline upload bukti bayar</span>
            <strong>{formatDateTime(order.paymentDeadline)}</strong>
            <em>{isPaymentExpired ? 'Waktu upload sudah habis' : `${formatRemainingTime(remainingSeconds)} tersisa`}</em>
          </div>
        </div>
      )}

      {hasUploadedProof ? (
        <div className="payment-proof-result">
          <CheckCircle2 aria-hidden="true" />
          <div className="payment-proof-result-content">
            <h3>Bukti bayar sudah diterima</h3>
            <p>Pesanan sedang menunggu konfirmasi pembayaran dari admin.</p>
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
      ) : (
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
                : 'Upload bukti baru bisa dilakukan setelah detail rekening muncul.'}
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
              Deadline upload sudah berakhir. Pesanan perlu dibatalkan otomatis oleh sistem.
            </div>
          )}

          <button type="submit" className="button primary payment-upload-button" disabled={!canUploadProof}>
            {isUploading ? (
              <>
                <Loader2 className="button-icon spin" aria-hidden="true" />
                Mengupload...
              </>
            ) : (
              <>
                <FileImage className="button-icon" aria-hidden="true" />
                Upload Bukti Bayar
              </>
            )}
          </button>
        </form>
      )}
    </>
  )
}
