import { useState } from 'react'
import { ChevronDown, ChevronUp, CreditCard, ExternalLink } from 'lucide-react'
import type { AdminOrder } from '../../../types/order'
import { formatDateTime } from '../../../utils/format'
import { getUploadUrl } from '../../orders/orderDisplay'

type AdminOrderPaymentPanelProps = {
  order: AdminOrder
}

const paymentMethodLabel: Record<AdminOrder['paymentMethod'], string> = {
  MANUAL_TRANSFER: 'Manual Transfer',
  PAYMENT_GATEWAY: 'Payment Gateway',
}

export function AdminOrderPaymentPanel({ order }: AdminOrderPaymentPanelProps) {
  const [isPaymentProofOpen, setIsPaymentProofOpen] = useState(false)
  const paymentProofUrl = getUploadUrl(order.paymentProof)

  return (
    <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-admin-accent-strong" />
        <h4 className="text-base font-bold text-admin-ink m-0">Pembayaran</h4>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <span className="block text-admin-ink-muted">Metode</span>
          <strong className="text-admin-ink">{paymentMethodLabel[order.paymentMethod]}</strong>
        </div>
        <div>
          <span className="block text-admin-ink-muted">Bukti Bayar</span>
          {paymentProofUrl ? (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setIsPaymentProofOpen((isOpen) => !isOpen)}
                className="inline-flex items-center gap-1.5 text-admin-accent-strong font-semibold bg-transparent border-none p-0 cursor-pointer hover:underline"
              >
                {isPaymentProofOpen ? 'Sembunyikan bukti' : 'Tampilkan bukti'}
                {isPaymentProofOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {isPaymentProofOpen && (
                <div className="mt-3 rounded-xl border border-admin-line-soft bg-white overflow-hidden">
                  <img
                    src={paymentProofUrl}
                    alt={`Bukti pembayaran ${order.orderNumber}`}
                    className="w-full max-h-80 object-contain"
                  />
                  <a
                    href={paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-admin-accent-strong no-underline hover:underline"
                  >
                    Buka di tab baru
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <strong className="text-admin-ink">Belum tersedia</strong>
          )}
        </div>
        <div>
          <span className="block text-admin-ink-muted">Deadline</span>
          <strong className="text-admin-ink">{formatDateTime(order.paymentDeadline)}</strong>
        </div>
      </div>
    </section>
  )
}
