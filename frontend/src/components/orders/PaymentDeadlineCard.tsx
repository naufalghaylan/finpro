import { Clock3 } from 'lucide-react'
import { formatDateTime } from './orderDisplay'
import { formatRemainingTime } from '../../utils/uploadProofDisplay'

type PaymentDeadlineCardProps = {
  paymentDeadline: string | null
  remainingSeconds: number
  isPaymentExpired: boolean
}

export function PaymentDeadlineCard({
  paymentDeadline,
  remainingSeconds,
  isPaymentExpired,
}: PaymentDeadlineCardProps) {
  if (!paymentDeadline) return null

  return (
    <div className={`payment-deadline-card ${isPaymentExpired ? 'expired' : ''}`}>
      <Clock3 aria-hidden="true" />
      <div>
        <span>Batas unggah bukti bayar</span>
        <strong>{formatDateTime(paymentDeadline)}</strong>
        <em>{isPaymentExpired ? 'Waktu unggah sudah habis' : `${formatRemainingTime(remainingSeconds)} tersisa`}</em>
      </div>
    </div>
  )
}
