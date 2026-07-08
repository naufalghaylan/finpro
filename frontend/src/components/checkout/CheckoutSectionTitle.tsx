import type { LucideIcon } from 'lucide-react'

type CheckoutSectionTitleProps = {
  icon: LucideIcon
  title: string
  description: string
}

export function CheckoutSectionTitle({ icon: Icon, title, description }: CheckoutSectionTitleProps) {
  return (
    <div className="checkout-section-title">
      <Icon aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}
