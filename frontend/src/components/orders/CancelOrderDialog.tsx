import { useEffect } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

type CancelOrderDialogProps = {
  isOpen: boolean
  orderNumber?: string
  reason: string
  isSubmitting: boolean
  onReasonChange: (reason: string) => void
  onClose: () => void
  onConfirm: () => void
}

export function CancelOrderDialog({
  isOpen,
  orderNumber,
  reason,
  isSubmitting,
  onReasonChange,
  onClose,
  onConfirm,
}: CancelOrderDialogProps) {
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
        className="dialog-card cancel-order-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="dialog-close-button"
          aria-label="Tutup konfirmasi pembatalan"
          disabled={isSubmitting}
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>

        <div className="dialog-icon danger">
          <AlertTriangle aria-hidden="true" />
        </div>

        <div className="dialog-copy">
          <span>Konfirmasi Pembatalan</span>
          <h2 id="cancel-order-title">Batalkan pesanan?</h2>
          <p>
            {orderNumber ? `Pesanan ${orderNumber} ` : 'Pesanan ini '}
            akan dibatalkan dan pembayaran tidak bisa dilanjutkan. Stok produk akan dikembalikan ke sistem.
          </p>
        </div>

        <label className="dialog-field">
          <span>Alasan pembatalan opsional</span>
          <textarea
            rows={3}
            maxLength={500}
            value={reason}
            disabled={isSubmitting}
            placeholder="Contoh: ingin mengubah pesanan"
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </label>

        <div className="dialog-actions">
          <button type="button" className="button ghost" disabled={isSubmitting} onClick={onClose}>
            Tetap Simpan
          </button>
          <button type="button" className="button danger" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? (
              <>
                <Loader2 className="button-icon spin" aria-hidden="true" />
                Membatalkan...
              </>
            ) : (
              'Ya, Batalkan'
            )}
          </button>
        </div>
      </section>
    </div>
  )
}
