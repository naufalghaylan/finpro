import { CreditCard, MapPin, Truck, type LucideIcon } from 'lucide-react'

const stepClassName = [
  'inline-flex items-center justify-center gap-2 rounded-lg border',
  'border-[rgba(232,107,79,0.16)] bg-[rgba(255,255,255,0.76)]',
  'px-3 py-2.75 text-[0.9rem] font-extrabold text-(--ink)',
  'shadow-[0_8px_20px_rgba(31,42,34,0.05)]',
  'max-[720px]:gap-1.5 max-[720px]:px-2 max-[720px]:py-2',
  'max-[720px]:text-[0.78rem] max-[720px]:leading-tight',
  'max-[420px]:gap-1 max-[420px]:px-1.5 max-[420px]:text-[0.72rem]',
].join(' ')

const iconClassName = 'size-4.5 shrink-0 text-(--accent-strong) max-[720px]:size-4 max-[420px]:size-3.5'
const steps = [{ label: 'Alamat', Icon: MapPin }, { label: 'Pengiriman', Icon: Truck }, { label: 'Pembayaran', Icon: CreditCard }]

export function CheckoutFlowSteps() {
  return (
    <div className="grid grid-cols-3 gap-2.5 max-[420px]:gap-1.5" aria-label="Urutan checkout">
      {steps.map((step) => <CheckoutFlowStep key={step.label} {...step} />)}
    </div>
  )
}

function CheckoutFlowStep({ Icon, label }: { Icon: LucideIcon; label: string }) {
  return (
    <span className={stepClassName}>
      <Icon className={iconClassName} aria-hidden="true" />
      {label}
    </span>
  )
}
