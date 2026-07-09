import { ArrowRight, PackageCheck, TicketPercent, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/format'

interface CartSummaryPanelProps {
  totalQuantity: number
  subtotal: number
  discount?: number
  total?: number
  fulfillmentBranch?: string
}

export function CartSummaryPanel({ totalQuantity, subtotal, discount = 0, total, fulfillmentBranch }: CartSummaryPanelProps) {
  const grandTotal = total ?? subtotal - discount
  const summaryRows = [
    { label: `Total harga (${totalQuantity} item)`, value: formatCurrency(subtotal) },
    ...(discount > 0 ? [{ label: 'Diskon produk', value: `- ${formatCurrency(discount)}` }] : []),
    { label: 'Ongkir', value: 'Pilih di checkout' },
  ]

  return (
    <aside className="cart-summary-panel" aria-label="Ringkasan keranjang">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h3 className="m-0">Ringkasan Belanja</h3>
        <span className="rounded-full bg-[rgba(232,107,79,0.1)] px-2.25 py-1.25 text-[0.78rem] font-extrabold text-(--accent-strong)">
          {totalQuantity} item
        </span>
      </div>

      <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-[rgba(74,124,91,0.18)] bg-[rgba(247,251,244,0.84)] p-3">
        <PackageCheck className="mt-0.5 size-4.5 shrink-0 text-(--green)" aria-hidden="true" />
        <div className="flex min-w-0 flex-col gap-0.75">
          <span className="text-[0.86rem] text-(--ink-soft)">Pengiriman PanenMart</span>
          <strong className="text-[0.94rem] leading-[1.35] text-(--ink)">
            Dikirim dari {fulfillmentBranch ?? 'cabang terdekat'}
          </strong>
        </div>
      </div>

      <div className="mb-3 grid gap-2" aria-label="Info voucher dan pengiriman">
        <div className="flex items-center gap-2.25 rounded-lg border border-[rgba(232,107,79,0.14)] bg-(--surface) px-2.75 py-2.5 text-[0.88rem] font-bold leading-[1.4] text-(--ink-soft)">
          <TicketPercent className="size-4.5 shrink-0 text-(--accent-strong)" aria-hidden="true" />
          <span>Voucher dipilih di checkout</span>
        </div>
        <div className="flex items-center gap-2.25 rounded-lg border border-[rgba(232,107,79,0.14)] bg-(--surface) px-2.75 py-2.5 text-[0.88rem] font-bold leading-[1.4] text-(--ink-soft)">
          <Truck className="size-4.5 shrink-0 text-(--accent-strong)" aria-hidden="true" />
          <span>Ongkir dihitung setelah alamat dipilih</span>
        </div>
      </div>

      {summaryRows.map((row) => (
        <div className="cart-summary-row" key={row.label}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
      <div className="cart-summary-row cart-summary-total">
        <span>Total sementara</span>
        <strong>{formatCurrency(grandTotal)}</strong>
      </div>
      <p className="mt-3 mb-0 text-[0.86rem] leading-[1.55] text-(--ink-soft)">
        Total akhir akan diperbarui setelah voucher, ongkir, dan alamat pengiriman dipilih.
      </p>
      <Link to="/checkout" className="button primary cart-checkout-button">
        <span>Checkout ({totalQuantity})</span>
        <ArrowRight className="button-icon" aria-hidden="true" />
      </Link>
    </aside>
  )
}
