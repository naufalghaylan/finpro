import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type CheckoutInlineAlertProps = {
  icon: LucideIcon
  children: ReactNode
  compact?: boolean
  warning?: boolean
}

export function CheckoutInlineAlert({ icon: Icon, children, compact = false, warning = false }: CheckoutInlineAlertProps) {
  return (
    <div className={`checkout-inline-alert ${compact ? 'compact' : ''} ${warning ? 'warning' : ''}`.trim()}>
      <Icon aria-hidden="true" />
      {children}
    </div>
  )
}
