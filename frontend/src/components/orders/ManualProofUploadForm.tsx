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

const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`
  if (sizeInBytes < 1024 * 1024) return `${Math.round(sizeInBytes / 1024)} KB`
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
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
  const isUploadDisabled = !selectedChannel || isPaymentExpired || isUploading
  const dropzoneClassName = [
    'payment-upload-dropzone',
    selectedFile ? 'has-file' : '',
    isUploadDisabled ? 'disabled' : '',
  ].filter(Boolean).join(' ')
  const uploadButtonLabel = selectedFile
    ? 'Unggah Bukti Bayar'
    : selectedChannel ? 'Pilih File Dulu' : 'Pilih Bank Dulu'

  return (
    <form className="payment-upload-form" onSubmit={onUploadProof}>
      <label className={dropzoneClassName}>
        <UploadCloud aria-hidden="true" />
        <strong>
          {selectedFile
            ? 'File siap diunggah'
            : selectedChannel
              ? 'Pilih file bukti bayar'
              : 'Pilih bank tujuan dulu'}
        </strong>
        <span>
          {selectedFile
            ? `${selectedFile.name} - ${formatFileSize(selectedFile.size)}`
            : selectedChannel
            ? 'Format JPG, JPEG, atau PNG. Maksimal 1MB.'
            : 'Unggah bukti baru bisa dilakukan setelah detail rekening muncul.'}
        </span>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          disabled={isUploadDisabled}
          onChange={onFileChange}
        />
      </label>

      {selectedFile && (
        <div className="payment-upload-file-card">
          <FileImage aria-hidden="true" />
          <div>
            <strong>{selectedFile.name}</strong>
            <span>{formatFileSize(selectedFile.size)} siap diunggah</span>
          </div>
        </div>
      )}

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
            {uploadButtonLabel}
          </>
        )}
      </button>
    </form>
  )
}
