import { useEffect } from 'react'
import { CheckCircle2, Loader2, X } from 'lucide-react'

type ConfirmReceiptDialogProps = {
  isOpen: boolean
  orderNumber?: string
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmReceiptDialog({
  isOpen,
  orderNumber,
  isSubmitting,
  onClose,
  onConfirm,
}: ConfirmReceiptDialogProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={isSubmitting ? undefined : onClose}>
      <section
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-receipt-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="dialog-close-button"
          aria-label="Tutup konfirmasi pesanan diterima"
          disabled={isSubmitting}
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>

        <div className="dialog-icon success">
          <CheckCircle2 aria-hidden="true" />
        </div>

        <div className="dialog-copy">
          <span>Konfirmasi Pesanan</span>
          <h2 id="confirm-receipt-title">Pesanan sudah diterima?</h2>
          <p>
            {orderNumber ? `Pesanan ${orderNumber} ` : 'Pesanan ini '}
            akan diselesaikan. Pastikan barang sudah kamu terima dalam kondisi sesuai.
          </p>
        </div>

        <div className="dialog-actions">
          <button type="button" className="button ghost" disabled={isSubmitting} onClick={onClose}>
            Cek Lagi
          </button>
          <button type="button" className="button primary" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? (
              <>
                <Loader2 className="button-icon spin" aria-hidden="true" />
                Memproses...
              </>
            ) : (
              'Ya, Diterima'
            )}
          </button>
        </div>
      </section>
    </div>
  )
}
