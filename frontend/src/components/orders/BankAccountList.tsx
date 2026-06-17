import { AlertCircle } from 'lucide-react'
import { MANUAL_PAYMENT_CHANNELS, type ManualPaymentChannel } from './manualPaymentChannels'

type BankAccountListProps = {
  selectedChannelCode: string
  selectedChannel: ManualPaymentChannel | null
  isPendingPayment: boolean
  canChangeMethod: boolean
  onChannelChange: (channelCode: string) => void
}

const MANUAL_PAYMENT_SELECTION_MESSAGE =
  'Pilih bank tujuan untuk melihat nomor rekening dan instruksi pembayaran.'

export function BankAccountList({
  selectedChannelCode,
  selectedChannel,
  isPendingPayment,
  canChangeMethod,
  onChannelChange,
}: BankAccountListProps) {
  return (
    <div className="manual-payment-selector">
      {!selectedChannel && isPendingPayment && (
        <div className="checkout-inline-alert">
          <AlertCircle aria-hidden="true" />
          {MANUAL_PAYMENT_SELECTION_MESSAGE}
        </div>
      )}

      <div className="manual-payment-grid" aria-label="Pilihan bank transfer">
        {MANUAL_PAYMENT_CHANNELS.map((channel) => {
          const ChannelIcon = channel.Icon

          return (
            <button
              key={channel.code}
              type="button"
              className={`manual-payment-option ${selectedChannelCode === channel.code ? 'active' : ''}`}
              disabled={!canChangeMethod}
              onClick={() => onChannelChange(channel.code)}
            >
              <ChannelIcon aria-hidden="true" />
              <strong>{channel.label}</strong>
            </button>
          )
        })}
      </div>
    </div>
  )
}
