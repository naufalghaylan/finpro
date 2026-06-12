import type { ChangeEvent, FormEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  FileImage,
  Landmark,
  Loader2,
  QrCode,
  Smartphone,
  UploadCloud,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import type { CheckoutOrder } from '../../types/order'
import { formatCurrency, formatDateTime } from './orderDisplay'

export type ManualPaymentGroup = 'bank' | 'ewallet' | 'qris'

type ManualPaymentChannel = {
  code: string
  group: ManualPaymentGroup
  label: string
  destinationLabel: string
  destinationValue: string
  destinationDisplayValue?: string
  accountHolder: string
  proofHint: string
  Icon: LucideIcon
}

type ManualPaymentSectionProps = {
  order: CheckoutOrder
  activeGroup: ManualPaymentGroup | null
  selectedChannelCode: string
  selectedFile: File | null
  previewUrl: string | null
  paymentProofUrl: string
  remainingSeconds: number
  isUploading: boolean
  hasCopiedDestination: boolean
  isProofExpanded: boolean
  onGroupChange: (group: ManualPaymentGroup) => void
  onChannelChange: (channelCode: string) => void
  onCopyDestination: (destinationValue: string) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onUploadProof: (event: FormEvent<HTMLFormElement>) => void
  onToggleProofExpanded: () => void
}

const MANUAL_PAYMENT_TABS: Array<{
  value: ManualPaymentGroup
  label: string
  Icon: LucideIcon
}> = [
  { value: 'bank', label: 'Transfer Bank', Icon: Landmark },
  { value: 'ewallet', label: 'E-Wallet', Icon: Smartphone },
  { value: 'qris', label: 'QRIS Manual', Icon: QrCode },
]

const MANUAL_PAYMENT_GROUP_LABELS: Record<ManualPaymentGroup, string> = {
  bank: 'Transfer Bank',
  ewallet: 'E-Wallet',
  qris: 'QRIS Manual',
}

const MANUAL_PAYMENT_CHANNELS: ManualPaymentChannel[] = [
  {
    code: 'bank-bca',
    group: 'bank',
    label: 'BCA',
    destinationLabel: 'No. Rekening',
    destinationValue: '3930101234',
    destinationDisplayValue: '39301 01234',
    accountHolder: 'PT PanenMart Bersama',
    proofHint: 'Upload screenshot mobile banking, internet banking, atau struk ATM.',
    Icon: Landmark,
  },
  {
    code: 'bank-bri',
    group: 'bank',
    label: 'BRI',
    destinationLabel: 'No. Rekening',
    destinationValue: '002601012345678',
    destinationDisplayValue: '00260 10123 45678',
    accountHolder: 'PT PanenMart Bersama',
    proofHint: 'Upload screenshot mobile banking, internet banking, atau struk ATM.',
    Icon: Landmark,
  },
  {
    code: 'bank-bni',
    group: 'bank',
    label: 'BNI',
    destinationLabel: 'No. Rekening',
    destinationValue: '0094567890',
    destinationDisplayValue: '00945 67890',
    accountHolder: 'PT PanenMart Bersama',
    proofHint: 'Upload screenshot mobile banking, internet banking, atau struk ATM.',
    Icon: Landmark,
  },
  {
    code: 'bank-mandiri',
    group: 'bank',
    label: 'Mandiri',
    destinationLabel: 'No. Rekening',
    destinationValue: '1300012345678',
    destinationDisplayValue: '13000 12345 678',
    accountHolder: 'PT PanenMart Bersama',
    proofHint: 'Upload screenshot mobile banking, internet banking, atau struk ATM.',
    Icon: Landmark,
  },
  {
    code: 'bank-cimb',
    group: 'bank',
    label: 'CIMB Niaga',
    destinationLabel: 'No. Rekening',
    destinationValue: '8000123456789',
    destinationDisplayValue: '80001 23456 789',
    accountHolder: 'PT PanenMart Bersama',
    proofHint: 'Upload screenshot mobile banking, internet banking, atau struk ATM.',
    Icon: Landmark,
  },
  {
    code: 'bank-permata',
    group: 'bank',
    label: 'Permata',
    destinationLabel: 'No. Rekening',
    destinationValue: '9001234567',
    destinationDisplayValue: '90012 34567',
    accountHolder: 'PT PanenMart Bersama',
    proofHint: 'Upload screenshot mobile banking, internet banking, atau struk ATM.',
    Icon: Landmark,
  },
  {
    code: 'ewallet-gopay',
    group: 'ewallet',
    label: 'GoPay',
    destinationLabel: 'No. HP Terdaftar',
    destinationValue: '081234567890',
    destinationDisplayValue: '0812 3456 7890',
    accountHolder: 'PanenMart Bersama',
    proofHint: 'Upload screenshot riwayat transaksi berhasil dari aplikasi e-wallet.',
    Icon: Smartphone,
  },
  {
    code: 'ewallet-ovo',
    group: 'ewallet',
    label: 'OVO',
    destinationLabel: 'No. HP Terdaftar',
    destinationValue: '085711223344',
    destinationDisplayValue: '0857 1122 3344',
    accountHolder: 'PanenMart Bersama',
    proofHint: 'Upload screenshot riwayat transaksi berhasil dari aplikasi e-wallet.',
    Icon: Smartphone,
  },
  {
    code: 'ewallet-dana',
    group: 'ewallet',
    label: 'DANA',
    destinationLabel: 'No. HP Terdaftar',
    destinationValue: '081934567890',
    destinationDisplayValue: '0819 3456 7890',
    accountHolder: 'PanenMart Bersama',
    proofHint: 'Upload screenshot riwayat transaksi berhasil dari aplikasi e-wallet.',
    Icon: Smartphone,
  },
  {
    code: 'ewallet-shopeepay',
    group: 'ewallet',
    label: 'ShopeePay',
    destinationLabel: 'No. HP Terdaftar',
    destinationValue: '087812345678',
    destinationDisplayValue: '0878 1234 5678',
    accountHolder: 'PanenMart Bersama',
    proofHint: 'Upload screenshot riwayat transaksi berhasil dari aplikasi e-wallet.',
    Icon: Smartphone,
  },
  {
    code: 'ewallet-linkaja',
    group: 'ewallet',
    label: 'LinkAja',
    destinationLabel: 'No. HP Terdaftar',
    destinationValue: '082212345678',
    destinationDisplayValue: '0822 1234 5678',
    accountHolder: 'PanenMart Bersama',
    proofHint: 'Upload screenshot riwayat transaksi berhasil dari aplikasi e-wallet.',
    Icon: Smartphone,
  },
  {
    code: 'qris-manual',
    group: 'qris',
    label: 'QRIS Merchant',
    destinationLabel: 'Merchant ID',
    destinationValue: 'NMID102030405060',
    accountHolder: 'PanenMart Bersama',
    proofHint: 'Scan QRIS merchant, lalu upload screenshot pembayaran berhasil.',
    Icon: QrCode,
  },
]

const QRIS_PATTERN_ROWS = [
  '1111111001011111111',
  '1000001001010000001',
  '1011101011110111011',
  '1011101000100111011',
  '1011101010100111011',
  '1000001011010000001',
  '1111111010101111111',
  '0000000001100000000',
  '1010111110011101011',
  '0011000101110011100',
  '1110111010001110101',
  '0001010111110001010',
  '1111111010011011101',
  '1000001011100010010',
  '1011101010111111011',
  '1000001001001000100',
  '1111111011111010111',
]

const getManualPaymentSelectionMessage = (group: ManualPaymentGroup | null) => {
  if (!group) {
    return 'Metode pembayaran belum dipilih. Pilih Transfer Bank, E-Wallet, atau QRIS Manual terlebih dahulu.'
  }

  if (group === 'bank') {
    return 'Pilih bank tujuan untuk melihat nomor rekening dan instruksi pembayaran.'
  }

  if (group === 'ewallet') {
    return 'Pilih e-wallet tujuan untuk melihat nomor HP terdaftar dan instruksi pembayaran.'
  }

  return 'Pilih QRIS Manual untuk menampilkan barcode pembayaran.'
}

const formatPaymentDestination = (value: string) => {
  if (/^08\d{8,11}$/.test(value)) {
    return value.replace(/(\d{4})(\d{4})(\d+)/, '$1 $2 $3')
  }

  return value.replace(/(\d{5})(?=\d)/g, '$1 ')
}

const formatRemainingTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const nextSeconds = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(nextSeconds).padStart(2, '0')}`
}

export function ManualPaymentSection({
  order,
  activeGroup,
  selectedChannelCode,
  selectedFile,
  previewUrl,
  paymentProofUrl,
  remainingSeconds,
  isUploading,
  hasCopiedDestination,
  isProofExpanded,
  onGroupChange,
  onChannelChange,
  onCopyDestination,
  onFileChange,
  onUploadProof,
  onToggleProofExpanded,
}: ManualPaymentSectionProps) {
  const selectedChannel =
    MANUAL_PAYMENT_CHANNELS.find((channel) => channel.code === selectedChannelCode) ?? null
  const visibleChannels = activeGroup
    ? MANUAL_PAYMENT_CHANNELS.filter((channel) => channel.group === activeGroup)
    : []
  const hasUploadedProof = Boolean(order.paymentProof)
  const canChangeMethod = order.status === 'PENDING_PAYMENT' && !hasUploadedProof
  const isPaymentExpired = order.status === 'PENDING_PAYMENT' && remainingSeconds <= 0
  const canUploadProof =
    order.status === 'PENDING_PAYMENT' &&
    Boolean(selectedChannel) &&
    !isPaymentExpired &&
    Boolean(selectedFile) &&
    !isUploading
  const SelectedChannelIcon = selectedChannel?.Icon ?? WalletCards
  const selectedDestinationDisplay = selectedChannel
    ? selectedChannel.destinationDisplayValue ?? formatPaymentDestination(selectedChannel.destinationValue)
    : ''

  return (
    <section className="checkout-panel payment-manual-panel">
      <div className="checkout-section-title">
        <WalletCards aria-hidden="true" />
        <div>
          <h2>Upload Bukti Transfer</h2>
          <p>Upload foto bukti bayar untuk melanjutkan proses pesanan manual transfer.</p>
        </div>
      </div>

      <div className="manual-payment-selector">
        {!selectedChannel && order.status === 'PENDING_PAYMENT' && (
          <div className="checkout-inline-alert">
            <AlertCircle aria-hidden="true" />
            {getManualPaymentSelectionMessage(activeGroup)}
          </div>
        )}

        <div className="manual-payment-tabs" role="tablist" aria-label="Metode pembayaran manual">
          {MANUAL_PAYMENT_TABS.map((tab) => {
            const TabIcon = tab.Icon

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={activeGroup === tab.value}
                className={`manual-payment-tab ${activeGroup === tab.value ? 'active' : ''}`}
                disabled={!canChangeMethod}
                onClick={() => onGroupChange(tab.value)}
              >
                <TabIcon aria-hidden="true" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeGroup && activeGroup !== 'qris' && (
          <div className="manual-payment-grid">
            {visibleChannels.map((channel) => {
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
        )}
      </div>

      {selectedChannel && (
        <div className="payment-bank-card">
          <div className="payment-bank-header">
            <SelectedChannelIcon aria-hidden="true" />
            <span>{MANUAL_PAYMENT_GROUP_LABELS[selectedChannel.group]}</span>
          </div>
          <h3>{selectedChannel.label}</h3>

          {selectedChannel.group === 'qris' ? (
            <div className="payment-bank-info-block payment-qris-block">
              <span>Scan QRIS</span>
              <div className="payment-qris-code" role="img" aria-label="Kode QRIS merchant">
                {QRIS_PATTERN_ROWS.map((row, rowIndex) =>
                  [...row].map((cell, cellIndex) => (
                    <span
                      key={`${rowIndex}-${cellIndex}`}
                      className={cell === '1' ? 'active' : undefined}
                      aria-hidden="true"
                    />
                  )),
                )}
              </div>
              <small>{selectedChannel.destinationValue}</small>
            </div>
          ) : (
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
          )}

          <div className="payment-bank-info-block">
            <span>Atas Nama</span>
            <strong className="payment-bank-account-name">{selectedChannel.accountHolder}</strong>
          </div>

          <div className="payment-bank-info-block payment-bank-total">
            <span>Nominal Transfer</span>
            <strong>{formatCurrency(order.totalAmount)}</strong>
          </div>

          <p className="payment-bank-instruction">{selectedChannel.proofHint}</p>
        </div>
      )}

      {order.status === 'PENDING_PAYMENT' && (
        <div className={`payment-deadline-card ${isPaymentExpired ? 'expired' : ''}`}>
          <Clock3 aria-hidden="true" />
          <div>
            <span>Deadline upload bukti bayar</span>
            <strong>{formatDateTime(order.paymentDeadline)}</strong>
            <em>{isPaymentExpired ? 'Waktu upload sudah habis' : `${formatRemainingTime(remainingSeconds)} tersisa`}</em>
          </div>
        </div>
      )}

      {hasUploadedProof ? (
        <div className="payment-proof-result">
          <CheckCircle2 aria-hidden="true" />
          <div className="payment-proof-result-content">
            <h3>Bukti bayar sudah diterima</h3>
            <p>Pesanan sedang menunggu konfirmasi pembayaran dari admin.</p>
            {paymentProofUrl && (
              <>
                <button
                  type="button"
                  className="payment-proof-toggle"
                  aria-expanded={isProofExpanded}
                  onClick={onToggleProofExpanded}
                >
                  {isProofExpanded ? (
                    <>
                      <ChevronUp className="button-icon" aria-hidden="true" />
                      Sembunyikan bukti bayar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="button-icon" aria-hidden="true" />
                      Lihat bukti bayar
                    </>
                  )}
                </button>

                {isProofExpanded && (
                  <div className="payment-proof-preview payment-proof-preview--uploaded">
                    <img src={paymentProofUrl} alt="Bukti pembayaran pesanan" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <form className="payment-upload-form" onSubmit={onUploadProof}>
          <label className="payment-upload-dropzone">
            <UploadCloud aria-hidden="true" />
            <strong>
              {selectedFile
                ? selectedFile.name
                : selectedChannel
                  ? 'Pilih file bukti bayar'
                  : 'Pilih detail pembayaran dulu'}
            </strong>
            <span>
              {selectedChannel
                ? 'Format JPG, JPEG, atau PNG. Maksimal 1MB.'
                : 'Upload bukti baru bisa dilakukan setelah detail pembayaran muncul.'}
            </span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              disabled={!selectedChannel || isPaymentExpired || isUploading}
              onChange={onFileChange}
            />
          </label>

          {previewUrl && (
            <div className="payment-proof-preview">
              <img src={previewUrl} alt="Preview bukti bayar" />
            </div>
          )}

          {isPaymentExpired && (
            <div className="checkout-inline-alert">
              <AlertCircle aria-hidden="true" />
              Deadline upload sudah berakhir. Pesanan perlu dibatalkan otomatis oleh sistem.
            </div>
          )}

          <button type="submit" className="button primary payment-upload-button" disabled={!canUploadProof}>
            {isUploading ? (
              <>
                <Loader2 className="button-icon spin" aria-hidden="true" />
                Mengupload...
              </>
            ) : (
              <>
                <FileImage className="button-icon" aria-hidden="true" />
                Upload Bukti Bayar
              </>
            )}
          </button>
        </form>
      )}
    </section>
  )
}
