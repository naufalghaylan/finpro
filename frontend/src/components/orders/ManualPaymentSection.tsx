import type { ChangeEvent, FormEvent } from 'react'
import { WalletCards } from 'lucide-react'
import type { CheckoutOrder } from '../../types/order'
import { MANUAL_PAYMENT_CHANNELS } from './manualPaymentChannels'
import { BankAccountList } from './BankAccountList'
import { BankDestinationInfo } from './BankDestinationInfo'
import { UploadProofBox } from './UploadProofBox'

type ManualPaymentSectionProps = {
  order: CheckoutOrder
  selectedChannelCode: string
  selectedFile: File | null
  previewUrl: string | null
  paymentProofUrl: string
  remainingSeconds: number
  isUploading: boolean
  hasCopiedDestination: boolean
  isProofExpanded: boolean
  onChannelChange: (channelCode: string) => void
  onCopyDestination: (destinationValue: string) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onUploadProof: (event: FormEvent<HTMLFormElement>) => void
  onToggleProofExpanded: () => void
}

export function ManualPaymentSection({
  order,
  selectedChannelCode,
  selectedFile,
  previewUrl,
  paymentProofUrl,
  remainingSeconds,
  isUploading,
  hasCopiedDestination,
  isProofExpanded,
  onChannelChange,
  onCopyDestination,
  onFileChange,
  onUploadProof,
  onToggleProofExpanded,
}: ManualPaymentSectionProps) {
  const selectedChannel =
    MANUAL_PAYMENT_CHANNELS.find((channel) => channel.code === selectedChannelCode) ?? null
  const hasUploadedProof = Boolean(order.paymentProof)
  const isPendingPayment = order.status === 'PENDING_PAYMENT'
  const canChangeMethod = isPendingPayment && !hasUploadedProof
  const isPaymentExpired = isPendingPayment && remainingSeconds <= 0
  const canUploadProof =
    isPendingPayment &&
    Boolean(selectedChannel) &&
    !isPaymentExpired &&
    Boolean(selectedFile) &&
    !isUploading

  return (
    <section className="checkout-panel payment-manual-panel">
      <div className="checkout-section-title">
        <WalletCards aria-hidden="true" />
        <div>
          <h2>Upload Bukti Transfer</h2>
          <p>Upload foto bukti bayar untuk melanjutkan proses pesanan manual transfer.</p>
        </div>
      </div>

      <BankAccountList
        selectedChannelCode={selectedChannelCode}
        selectedChannel={selectedChannel}
        isPendingPayment={isPendingPayment}
        canChangeMethod={canChangeMethod}
        onChannelChange={onChannelChange}
      />

      {selectedChannel && (
        <BankDestinationInfo
          selectedChannel={selectedChannel}
          hasCopiedDestination={hasCopiedDestination}
          totalAmount={order.totalAmount}
          onCopyDestination={onCopyDestination}
        />
      )}

      <UploadProofBox
        order={order}
        selectedChannel={selectedChannel}
        selectedFile={selectedFile}
        previewUrl={previewUrl}
        paymentProofUrl={paymentProofUrl}
        remainingSeconds={remainingSeconds}
        isUploading={isUploading}
        isProofExpanded={isProofExpanded}
        hasUploadedProof={hasUploadedProof}
        isPaymentExpired={isPaymentExpired}
        canUploadProof={canUploadProof}
        onFileChange={onFileChange}
        onUploadProof={onUploadProof}
        onToggleProofExpanded={onToggleProofExpanded}
      />
    </section>
  )
}
