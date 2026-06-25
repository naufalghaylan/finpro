import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

type UploadedProofResultProps = {
  uploadedProofMessage: string
  paymentProofUrl: string
  isProofExpanded: boolean
  isVerifiedPaymentStatus: boolean
  onToggleProofExpanded: () => void
}

export function UploadedProofResult({
  uploadedProofMessage,
  paymentProofUrl,
  isProofExpanded,
  isVerifiedPaymentStatus,
  onToggleProofExpanded,
}: UploadedProofResultProps) {
  return (
    <div className={`payment-proof-result ${isVerifiedPaymentStatus ? 'payment-proof-result--verified' : ''}`}>
      <CheckCircle2 aria-hidden="true" />
      <div className="payment-proof-result-content">
        <h3>Bukti bayar sudah diterima</h3>
        <p>{uploadedProofMessage}</p>
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
  )
}
