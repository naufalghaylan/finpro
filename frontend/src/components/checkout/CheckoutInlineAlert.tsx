import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type CheckoutInlineAlertProps = {
  icon: LucideIcon
  children: ReactNode
  compact?: boolean
}

export function CheckoutInlineAlert({ icon: Icon, children, compact = false }: CheckoutInlineAlertProps) {
  return (
    <div className={`checkout-inline-alert ${compact ? 'compact' : ''}`.trim()}>
      <Icon aria-hidden="true" />
      {children}
    </div>
  )
}
