import { Copy, WalletCards } from 'lucide-react'
import { formatCurrency } from './orderDisplay'
import type { ManualPaymentChannel } from './manualPaymentChannels'

type BankDestinationInfoProps = {
  selectedChannel: ManualPaymentChannel
  hasCopiedDestination: boolean
  totalAmount: number
  onCopyDestination: (destinationValue: string) => void
}

const formatPaymentDestination = (value: string) => {
  if (/^08\d{8,11}$/.test(value)) {
    return value.replace(/(\d{4})(\d{4})(\d+)/, '$1 $2 $3')
  }

  return value.replace(/(\d{5})(?=\d)/g, '$1 ')
}

export function BankDestinationInfo({
  selectedChannel,
  hasCopiedDestination,
  totalAmount,
  onCopyDestination,
}: BankDestinationInfoProps) {
  const SelectedChannelIcon = selectedChannel.Icon ?? WalletCards
  const selectedDestinationDisplay =
    selectedChannel.destinationDisplayValue ?? formatPaymentDestination(selectedChannel.destinationValue)

  return (
    <div className="payment-bank-card">
      <div className="payment-bank-header">
        <SelectedChannelIcon aria-hidden="true" />
        <span>Transfer Bank</span>
      </div>
      <h3>{selectedChannel.label}</h3>

      <div className="payment-bank-info-block">
        <span>{selectedChannel.destinationLabel}</span>
        <div className="payment-bank-value-row">
          <strong>{selectedDestinationDisplay}</strong>
          <button
            type="button"
            className={`button ghost payment-bank-copy ${hasCopiedDestination ? 'copied' : ''}`}
            onClick={() => onCopyDestination(selectedChannel.destinationValue)}
            aria-label={`Salin ${selectedChannel.destinationLabel.toLowerCase()}`}
          >
            <Copy className="button-icon" aria-hidden="true" />
            {hasCopiedDestination ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </div>

      <div className="payment-bank-info-block">
        <span>Atas Nama</span>
        <strong className="payment-bank-account-name">{selectedChannel.accountHolder}</strong>
      </div>

      <div className="payment-bank-info-block payment-bank-total">
        <span>Nominal Transfer</span>
        <strong>{formatCurrency(totalAmount)}</strong>
      </div>

      <p className="payment-bank-instruction">{selectedChannel.proofHint}</p>
    </div>
  )
}
