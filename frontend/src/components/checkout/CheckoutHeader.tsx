import { Loader2 } from 'lucide-react'

type CheckoutHeaderProps = {
  isRefreshingPreview: boolean
}

export function CheckoutHeader({ isRefreshingPreview }: CheckoutHeaderProps) {
  return (
    <div className="checkout-header">
      <div>
        <p className="eyebrow">Checkout</p>
        <h1>Finalisasi pesananmu</h1>
        <p>Lengkapi alamat, pengiriman, voucher, dan pembayaran. Cabang PanenMart akan dipilih dari lokasi yang paling sesuai dengan alamatmu.</p>
      </div>
      {isRefreshingPreview && <CheckoutRefreshStatus />}
    </div>
  )
}

function CheckoutRefreshStatus() {
  return (
    <span className="checkout-refresh-status">
      <Loader2 className="button-icon spin" aria-hidden="true" />
      Memperbarui cabang
    </span>
  )
}
