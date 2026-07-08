import type { ChangeEvent, FormEvent } from 'react'
import type { CheckoutOrder } from '../../types/order'
import type { ManualPaymentChannel } from './manualPaymentChannels'
import { getUploadedProofMessage, getNoProofCopy } from '../../utils/uploadProofDisplay'
import { PaymentDeadlineCard } from './PaymentDeadlineCard'
import { UploadedProofResult } from './UploadedProofResult'
import { ManualProofUploadForm } from './ManualProofUploadForm'
import { NoProofRequiredState } from './NoProofRequiredState'

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
  const isVerifiedPaymentStatus = (
    order.status === 'PROCESSING' ||
    order.status === 'SHIPPED' ||
    order.status === 'CONFIRMED'
  )
  const uploadedProofMessage = getUploadedProofMessage(order.status)
  const shouldShowUploadForm = order.status === 'PENDING_PAYMENT' && !hasUploadedProof
  const noProofCopy = getNoProofCopy(order)

  return (
    <>
      {order.status === 'PENDING_PAYMENT' && (
        <PaymentDeadlineCard
          paymentDeadline={order.paymentDeadline}
          remainingSeconds={remainingSeconds}
          isPaymentExpired={isPaymentExpired}
        />
      )}

      {hasUploadedProof ? (
        <UploadedProofResult
          uploadedProofMessage={uploadedProofMessage}
          paymentProofUrl={paymentProofUrl}
          isProofExpanded={isProofExpanded}
          isVerifiedPaymentStatus={isVerifiedPaymentStatus}
          onToggleProofExpanded={onToggleProofExpanded}
        />
      ) : shouldShowUploadForm ? (
        <ManualProofUploadForm
          selectedChannel={selectedChannel}
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          isUploading={isUploading}
          isPaymentExpired={isPaymentExpired}
          canUploadProof={canUploadProof}
          onFileChange={onFileChange}
          onUploadProof={onUploadProof}
        />
      ) : (
        <NoProofRequiredState
          noProofCopy={noProofCopy}
          isCancelled={order.status === 'CANCELLED'}
        />
      )}
    </>
  )
}