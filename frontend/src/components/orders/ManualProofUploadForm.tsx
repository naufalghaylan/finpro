import type { ChangeEvent, FormEvent } from 'react'
import { AlertCircle, FileImage, Loader2, UploadCloud } from 'lucide-react'
import type { ManualPaymentChannel } from './manualPaymentChannels'

type ManualProofUploadFormProps = {
  selectedChannel: ManualPaymentChannel | null
  selectedFile: File | null
  previewUrl: string | null
  isUploading: boolean
  isPaymentExpired: boolean
  canUploadProof: boolean
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onUploadProof: (event: FormEvent<HTMLFormElement>) => void
}

export function ManualProofUploadForm({
  selectedChannel,
  selectedFile,
  previewUrl,
  isUploading,
  isPaymentExpired,
  canUploadProof,
  onFileChange,
  onUploadProof,
}: ManualProofUploadFormProps) {
  return (
    <form className="payment-upload-form" onSubmit={onUploadProof}>
      <label className="payment-upload-dropzone">
        <UploadCloud aria-hidden="true" />
        <strong>
          {selectedFile
            ? selectedFile.name
            : selectedChannel
              ? 'Pilih file bukti bayar'
              : 'Pilih bank tujuan dulu'}
        </strong>
        <span>
          {selectedChannel
            ? 'Format JPG, JPEG, atau PNG. Maksimal 1MB.'
            : 'Unggah bukti baru bisa dilakukan setelah detail rekening muncul.'}
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
          Batas unggah sudah berakhir. Pesanan akan dibatalkan otomatis oleh sistem.
        </div>
      )}

      <button type="submit" className="button primary payment-upload-button" disabled={!canUploadProof}>
        {isUploading ? (
          <>
            <Loader2 className="button-icon spin" aria-hidden="true" />
            Mengunggah...
          </>
        ) : (
          <>
            <FileImage className="button-icon" aria-hidden="true" />
            Unggah Bukti Bayar
          </>
        )}
      </button>
    </form>
  )
}
