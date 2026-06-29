import { PaymentMethod } from '../../generated/prisma/client'
import {
  sendOrderNotificationEmail,
  type OrderNotificationEmailParams,
} from '../../lib/mailer'
import prisma from '../../lib/prisma'

export type OrderNotificationEvent =
  | 'CHECKOUT_CREATED'
  | 'PAYMENT_SUCCESS'
  | 'ORDER_SHIPPED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'

type EventContent = Pick<
  OrderNotificationEmailParams,
  'subject' | 'title' | 'message' | 'statusLabel' | 'actionLabel'
>

const getEventContent = (
  event: OrderNotificationEvent,
  orderNumber: string,
): EventContent => {
  const contents: Record<OrderNotificationEvent, EventContent> = {
    CHECKOUT_CREATED: {
      subject: `Pesanan ${orderNumber} berhasil dibuat`,
      title: 'Pesanan berhasil dibuat',
      message: 'Pesanan Anda sudah kami terima. Silakan selesaikan pembayaran agar pesanan dapat segera diproses.',
      statusLabel: 'Menunggu pembayaran',
      actionLabel: 'Lihat dan bayar pesanan',
    },
    PAYMENT_SUCCESS: {
      subject: `Pembayaran ${orderNumber} berhasil`,
      title: 'Pembayaran berhasil',
      message: 'Pembayaran Anda telah dikonfirmasi. Tim PanenMart sedang menyiapkan pesanan Anda.',
      statusLabel: 'Sedang diproses',
      actionLabel: 'Lihat detail pesanan',
    },
    ORDER_SHIPPED: {
      subject: `Pesanan ${orderNumber} sedang dikirim`,
      title: 'Pesanan sedang dikirim',
      message: 'Kabar baik! Pesanan Anda telah diserahkan untuk proses pengiriman ke alamat tujuan.',
      statusLabel: 'Sedang dikirim',
      actionLabel: 'Lacak status pesanan',
    },
    ORDER_CONFIRMED: {
      subject: `Pesanan ${orderNumber} telah selesai`,
      title: 'Pesanan telah diterima',
      message: 'Pesanan telah dikonfirmasi diterima. Terima kasih sudah berbelanja kebutuhan segar di PanenMart.',
      statusLabel: 'Selesai',
      actionLabel: 'Lihat detail pesanan',
    },
    ORDER_CANCELLED: {
      subject: `Pesanan ${orderNumber} dibatalkan`,
      title: 'Pesanan dibatalkan',
      message: 'Pesanan Anda telah dibatalkan. Detail alasan pembatalan dapat dilihat di bawah ini.',
      statusLabel: 'Dibatalkan',
      actionLabel: 'Lihat detail pesanan',
    },
  }

  return contents[event]
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(amount)

const formatDate = (date: Date) => new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
}).format(date)

const getFrontendUrl = () => (
  process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
).replace(/\/$/, '')

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.MANUAL_TRANSFER]: 'Transfer manual',
  [PaymentMethod.PAYMENT_GATEWAY]: 'Payment gateway',
}

const getRecipientAddress = (address: {
  recipientName: string
  address: string
  district: string | null
  city: string
  province: string
  postalCode: string | null
}) => [
  address.recipientName,
  address.address,
  address.district,
  address.city,
  address.province,
  address.postalCode,
].filter(Boolean).join(', ')

export const notifyOrderStatusChange = async (
  orderId: number,
  event: OrderNotificationEvent,
) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        paymentMethod: true,
        paymentDeadline: true,
        shippingMethod: true,
        shippingService: true,
        cancelReason: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        address: {
          select: {
            recipientName: true,
            address: true,
            district: true,
            city: true,
            province: true,
            postalCode: true,
          },
        },
        items: {
          select: {
            quantity: true,
            subtotal: true,
            product: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!order) {
      console.error(`[ORDER_NOTIFICATION] Order ${orderId} not found for event ${event}`)
      return false
    }

    const content = getEventContent(event, order.orderNumber)
    const shippingInfo = [order.shippingMethod, order.shippingService]
      .filter(Boolean)
      .join(' - ')

    await sendOrderNotificationEmail({
      email: order.user.email,
      customerName: order.user.name,
      orderNumber: order.orderNumber,
      totalAmount: formatCurrency(order.totalAmount),
      actionUrl: `${getFrontendUrl()}/orders/${order.id}`,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        subtotal: formatCurrency(item.subtotal),
      })),
      paymentMethod: paymentMethodLabels[order.paymentMethod],
      paymentDeadline: event === 'CHECKOUT_CREATED' && order.paymentDeadline
        ? formatDate(order.paymentDeadline)
        : undefined,
      shippingInfo: shippingInfo || undefined,
      recipientAddress: getRecipientAddress(order.address),
      cancelReason: event === 'ORDER_CANCELLED'
        ? order.cancelReason || 'Pesanan dibatalkan'
        : undefined,
      ...content,
    })

    return true
  } catch (error) {
    console.error(`[ORDER_NOTIFICATION] Failed for order ${orderId}, event ${event}:`, error)
    return false
  }
}
