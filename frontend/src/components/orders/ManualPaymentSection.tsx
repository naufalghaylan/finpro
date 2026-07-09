import type { ChangeEvent, FormEvent } from 'react'
import { WalletCards } from 'lucide-react'
import type { CheckoutOrder } from '../../types/order'
import { MANUAL_PAYMENT_CHANNELS } from './manualPaymentChannels'
import { BankAccountList } from './BankAccountList'
import { BankDestinationInfo } from './BankDestinationInfo'
import { UploadProofBox } from './UploadProofBox'
import { ManualPaymentSteps } from './ManualPaymentSteps'

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

const getManualPaymentCopy = (order: CheckoutOrder, hasUploadedProof: boolean) => {
  if (order.status === 'PENDING_PAYMENT' && !hasUploadedProof) {
    return {
      title: 'Unggah Bukti Transfer',
      description: 'Pilih rekening tujuan, lakukan transfer, lalu unggah foto bukti bayar sebelum batas waktu berakhir.',
    }
  }

  if (hasUploadedProof) {
    return {
      title: 'Bukti Transfer',
      description: 'Bukti bayar sudah tersimpan pada pesanan ini. Status verifikasi mengikuti posisi pesanan saat ini.',
    }
  }

  if (order.status === 'CANCELLED') {
    return {
      title: 'Transfer Manual',
      description: 'Pesanan sudah dibatalkan, sehingga pembayaran dan unggah bukti tidak perlu dilanjutkan.',
    }
  }

  return {
    title: 'Transfer Manual',
    description: 'Pembayaran transfer manual tidak memerlukan tindakan tambahan pada status pesanan saat ini.',
  }
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
  const hasUploadedProof = Boolean(order.paymentProof)
  const isPendingPayment = order.status === 'PENDING_PAYMENT'
  const shouldShowPaymentSetup = isPendingPayment && !hasUploadedProof
  const selectedChannel = shouldShowPaymentSetup
    ? MANUAL_PAYMENT_CHANNELS.find((channel) => channel.code === selectedChannelCode) ?? null
    : null
  const canChangeMethod = shouldShowPaymentSetup
  const isPaymentExpired = isPendingPayment && remainingSeconds <= 0
  const canUploadProof = (
    shouldShowPaymentSetup &&
    Boolean(selectedChannel) &&
    !isPaymentExpired &&
    Boolean(selectedFile) &&
    !isUploading
  )
  const copy = getManualPaymentCopy(order, hasUploadedProof)

  return (
    <section className="checkout-panel payment-manual-panel">
      <div className="checkout-section-title">
        <WalletCards aria-hidden="true" />
        <div>
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
      </div>

      {shouldShowPaymentSetup && (
        <>
          <ManualPaymentSteps selectedChannel={selectedChannel} selectedFile={selectedFile} />
          <BankAccountList
            selectedChannelCode={selectedChannelCode}
            selectedChannel={selectedChannel}
            isPendingPayment={isPendingPayment}
            canChangeMethod={canChangeMethod}
            onChannelChange={onChannelChange}
          />
        </>
      )}

      {shouldShowPaymentSetup && selectedChannel && (
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
