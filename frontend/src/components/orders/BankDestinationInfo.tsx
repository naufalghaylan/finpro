import { Copy, WalletCards } from 'lucide-react'
import { formatCurrency } from './orderDisplay'
import type { ManualPaymentChannel } from './manualPaymentChannels'

type BankDestinationInfoProps = {
  selectedChannel: ManualPaymentChannel
  hasCopiedDestination: boolean
  totalAmount: number
  onCopyDestination: (destinationValue: string) => void
}

type DestinationCopyProps = Pick<BankDestinationInfoProps, 'hasCopiedDestination' | 'onCopyDestination'> & {
  selectedChannel: ManualPaymentChannel
}

const formatPaymentDestination = (value: string) => {
  if (/^08\d{8,11}$/.test(value)) {
    return value.replace(/(\d{4})(\d{4})(\d+)/, '$1 $2 $3')
  }

  return value.replace(/(\d{5})(?=\d)/g, '$1 ')
}

const getDestinationDisplayValue = (selectedChannel: ManualPaymentChannel) =>
  selectedChannel.destinationDisplayValue ?? formatPaymentDestination(selectedChannel.destinationValue)

export function BankDestinationInfo(props: BankDestinationInfoProps) {
  return (
    <div className="payment-bank-card">
      <PaymentBankHeader selectedChannel={props.selectedChannel} />
      <PaymentDestinationRow selectedChannel={props.selectedChannel} hasCopiedDestination={props.hasCopiedDestination} onCopyDestination={props.onCopyDestination} />
      <PaymentAccountHolder accountHolder={props.selectedChannel.accountHolder} />
      <PaymentTransferTotal totalAmount={props.totalAmount} />
      <p className="payment-bank-instruction">{props.selectedChannel.proofHint}</p>
    </div>
  )
}

function PaymentBankHeader({ selectedChannel }: { selectedChannel: ManualPaymentChannel }) {
  const SelectedChannelIcon = selectedChannel.Icon ?? WalletCards

  return (
    <>
      <div className="payment-bank-header">
        <SelectedChannelIcon aria-hidden="true" />
        <span>Transfer Bank</span>
      </div>
      <h3>{selectedChannel.label}</h3>
    </>
  )
}

function PaymentDestinationRow(props: DestinationCopyProps) {
  const destinationDisplay = getDestinationDisplayValue(props.selectedChannel)

  return (
    <div className="payment-bank-info-block">
      <span>{props.selectedChannel.destinationLabel}</span>
      <div className="payment-bank-value-row">
        <strong>{destinationDisplay}</strong>
        <CopyDestinationButton {...props} />
      </div>
    </div>
  )
}

function CopyDestinationButton({ selectedChannel, hasCopiedDestination, onCopyDestination }: DestinationCopyProps) {
  const copyLabel = hasCopiedDestination ? 'Tersalin' : 'Salin'

  return (
    <button type="button" className={`button ghost payment-bank-copy ${hasCopiedDestination ? 'copied' : ''}`} onClick={() => onCopyDestination(selectedChannel.destinationValue)} aria-label={`Salin ${selectedChannel.destinationLabel.toLowerCase()}`}>
      <Copy className="button-icon" aria-hidden="true" />
      {copyLabel}
    </button>
  )
}

function PaymentAccountHolder({ accountHolder }: { accountHolder: string }) {
  return (
    <div className="payment-bank-info-block payment-bank-account-block">
      <span>Atas Nama</span>
      <strong className="payment-bank-account-name">{accountHolder}</strong>
    </div>
  )
}

function PaymentTransferTotal({ totalAmount }: { totalAmount: number }) {
  return (
    <div className="payment-bank-info-block payment-bank-total">
      <span>Nominal Transfer</span>
      <strong>{formatCurrency(totalAmount)}</strong>
      <em className="payment-bank-total-note">Transfer tepat sesuai nominal agar verifikasi lebih cepat.</em>
    </div>
  )
}
