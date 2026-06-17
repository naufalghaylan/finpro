import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { CancelOrderDialog } from '../../components/orders/CancelOrderDialog'
import { ConfirmReceiptDialog } from '../../components/orders/ConfirmReceiptDialog'
import { ManualPaymentSection } from '../../components/orders/ManualPaymentSection'
import { OrderProductsPanel } from '../../components/orders/OrderProductsPanel'
import { OrderTrackingTimeline } from '../../components/orders/OrderTrackingTimeline'
import { PaymentGatewaySection } from '../../components/orders/PaymentGatewaySection'
import { PaymentSummaryPanel } from '../../components/orders/PaymentSummaryPanel'
import { orderStatusDisplay } from '../../components/orders/orderDisplay'
import { BRAND, footerSections, navLinks } from '../../data/home/homeData'
import { usePayment } from '../../hooks/payment/usePayment'

export default function PaymentPage() {
  const {
    order,
    selectedManualChannelCode,
    selectedFile,
    previewUrl,
    remainingSeconds,
    isLoading,
    isUploading,
    isCancellingOrder,
    isConfirmingReceipt,
    isPayingWithMidtrans,
    isMidtransPaymentOpen,
    midtransEmbedError,
    hasCopiedManualDestination,
    isPaymentProofExpanded,
    isCancelDialogOpen,
    isConfirmReceiptDialogOpen,
    cancelReason,
    error,
    midtransEmbedContainerId,
    isManualTransfer,
    isGatewayPayment,
    canCancelOrder,
    canConfirmReceipt,
    paymentProofUrl,
    setIsPaymentProofExpanded,
    setIsCancelDialogOpen,
    setIsConfirmReceiptDialogOpen,
    setCancelReason,
    loadOrder,
    handleCopyPaymentDestination,
    handleManualPaymentChannelChange,
    handleFileChange,
    handleUploadProof,
    handleCancelOrder,
    handleConfirmReceipt,
    handleRetryMidtransEmbed,
  } = usePayment()

  return (
    <div>
      <Navbar brandName={BRAND.name} links={navLinks} />

      <main className="payment-page">
        <section className="shell payment-shell">
          <Link to="/orders" className="button ghost checkout-back-link">
            <ArrowLeft className="button-icon" aria-hidden="true" />
            Kembali ke Pesanan
          </Link>

          {isLoading ? (
            <div className="checkout-state-card">
              <Loader2 className="checkout-state-icon spin" aria-hidden="true" />
              <h2>Menyiapkan pembayaran...</h2>
              <p>Kami sedang mengambil detail pesananmu.</p>
            </div>
          ) : error ? (
            <div className="checkout-state-card">
              <AlertCircle className="checkout-state-icon danger" aria-hidden="true" />
              <h2>Detail pesanan belum bisa dibuka</h2>
              <p>{error}</p>
              <button type="button" className="button primary" onClick={() => void loadOrder()}>
                Coba Lagi
              </button>
            </div>
          ) : order ? (
            <>
              <div className="checkout-header">
                <div>
                  <p className="eyebrow">Detail Pesanan</p>
                  <h1>{order.orderNumber}</h1>
                  <p>
                    {order.status === 'PENDING_PAYMENT'
                      ? 'Selesaikan pembayaran sesuai metode yang dipilih agar pesanan bisa diproses.'
                      : 'Pantau status pesanan, rincian pembayaran, dan produk yang sudah kamu checkout.'}
                  </p>
                </div>
                <span className={`payment-status payment-status--${order.status.toLowerCase()}`}>
                  {orderStatusDisplay[order.status].label}
                </span>
              </div>

              <div className="payment-layout">
                <div className="checkout-main-column">
                  <OrderTrackingTimeline order={order} />

                  {isManualTransfer && (
                    <ManualPaymentSection
                      order={order}
                      selectedChannelCode={selectedManualChannelCode}
                      selectedFile={selectedFile}
                      previewUrl={previewUrl}
                      paymentProofUrl={paymentProofUrl}
                      remainingSeconds={remainingSeconds}
                      isUploading={isUploading}
                      hasCopiedDestination={hasCopiedManualDestination}
                      isProofExpanded={isPaymentProofExpanded}
                      onChannelChange={handleManualPaymentChannelChange}
                      onCopyDestination={(destinationValue) => void handleCopyPaymentDestination(destinationValue)}
                      onFileChange={handleFileChange}
                      onUploadProof={handleUploadProof}
                      onToggleProofExpanded={() => setIsPaymentProofExpanded((current) => !current)}
                    />
                  )}

                  {isGatewayPayment && (
                    <PaymentGatewaySection
                      order={order}
                      embedContainerId={midtransEmbedContainerId}
                      isPreparing={isPayingWithMidtrans}
                      isEmbedReady={isMidtransPaymentOpen}
                      errorMessage={midtransEmbedError}
                      onRetry={handleRetryMidtransEmbed}
                    />
                  )}

                  <OrderProductsPanel order={order} />
                </div>

                <PaymentSummaryPanel
                  order={order}
                  isManualTransfer={Boolean(isManualTransfer)}
                  canCancel={Boolean(canCancelOrder)}
                  isCancelling={isCancellingOrder}
                  canConfirmReceipt={Boolean(canConfirmReceipt)}
                  isConfirmingReceipt={isConfirmingReceipt}
                  onCancelClick={() => setIsCancelDialogOpen(true)}
                  onConfirmReceiptClick={() => setIsConfirmReceiptDialogOpen(true)}
                />
              </div>
            </>
          ) : null}
        </section>
      </main>

      <CancelOrderDialog
        isOpen={isCancelDialogOpen}
        orderNumber={order?.orderNumber}
        reason={cancelReason}
        isSubmitting={isCancellingOrder}
        onReasonChange={setCancelReason}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={() => void handleCancelOrder()}
      />

      <ConfirmReceiptDialog
        isOpen={isConfirmReceiptDialogOpen}
        orderNumber={order?.orderNumber}
        isSubmitting={isConfirmingReceipt}
        onClose={() => setIsConfirmReceiptDialogOpen(false)}
        onConfirm={() => void handleConfirmReceipt()}
      />

      <HomeFooter sections={footerSections} brandName={BRAND.name} />
    </div>
  )
}
