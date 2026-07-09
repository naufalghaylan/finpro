import { CheckCircle2 } from 'lucide-react'
import type { ManualPaymentChannel } from './manualPaymentChannels'

type ManualPaymentStepsProps = {
  selectedChannel: ManualPaymentChannel | null
  selectedFile: File | null
}

const getStepClassName = (isDone: boolean, isActive: boolean) => [
  'manual-payment-step',
  isDone ? 'done' : '',
  isActive ? 'active' : '',
].filter(Boolean).join(' ')

export function ManualPaymentSteps({ selectedChannel, selectedFile }: ManualPaymentStepsProps) {
  const hasBank = Boolean(selectedChannel)
  const hasFile = Boolean(selectedFile)

  const steps = [
    { label: 'Pilih Bank', isDone: hasBank, isActive: !hasBank },
    { label: 'Transfer', isDone: hasFile, isActive: hasBank && !hasFile },
    { label: 'Upload Bukti', isDone: false, isActive: hasFile },
  ]

  return (
    <div className="manual-payment-steps" aria-label="Langkah pembayaran transfer">
      {steps.map((step, index) => (
        <div key={step.label} className={getStepClassName(step.isDone, step.isActive)}>
          <span className="manual-payment-step-index">
            {step.isDone ? <CheckCircle2 aria-hidden="true" /> : index + 1}
          </span>
          <strong>{step.label}</strong>
        </div>
      ))}
    </div>
  )
}
