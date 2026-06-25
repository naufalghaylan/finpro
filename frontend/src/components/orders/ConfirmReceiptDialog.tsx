import { useEffect } from 'react'
import { CheckCircle2, ClipboardCheck, Loader2, PackageCheck, ShieldCheck, X } from 'lucide-react'

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
        className="dialog-card confirm-receipt-dialog"
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

        <div className="dialog-icon success confirm-receipt-dialog-icon">
          <PackageCheck aria-hidden="true" />
        </div>

        <div className="dialog-copy">
          <span>Konfirmasi Pesanan</span>
          <h2 id="confirm-receipt-title">Pesanan sudah diterima?</h2>
          <p>
            {orderNumber ? `Pesanan ${orderNumber} ` : 'Pesanan ini '}
            akan ditandai selesai. Pastikan detail berikut sudah sesuai sebelum melanjutkan.
          </p>
        </div>

        <ul className="dialog-checklist" aria-label="Hal yang perlu dipastikan">
          <li>
            <CheckCircle2 aria-hidden="true" />
            Barang sudah diterima oleh penerima.
          </li>
          <li>
            <ShieldCheck aria-hidden="true" />
            Jumlah dan kondisi barang sudah sesuai.
          </li>
          <li>
            <ClipboardCheck aria-hidden="true" />
            Status pesanan akan berubah menjadi selesai.
          </li>
        </ul>

        <div className="dialog-support-note">
          Setelah dikonfirmasi, pesanan tidak masuk lagi ke daftar pengiriman aktif.
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
              'Ya, Pesanan Diterima'
            )}
          </button>
        </div>
      </section>
    </div>
  )
}
