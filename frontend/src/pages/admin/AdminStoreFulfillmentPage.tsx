import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  PackageCheck,
  Search,
  Truck,
  X,
  XCircle,
} from 'lucide-react'
import {
  approveOrderFulfillment,
  approveOrderFulfillments,
  getStoreFulfillments,
  receiveOrderFulfillment,
  receiveOrderFulfillments,
  rejectOrderFulfillment,
  rejectOrderFulfillments,
} from '../../api/order.api'
import { AdminModal } from '../../components/admin/AdminModal'
import { formatDateTime } from '../../components/orders/orderDisplay'
import {
  AdminStoreFulfillmentGroupCard,
} from '../../components/admin/orders/AdminStoreFulfillmentGroupCard'
import {
  getGroupStatus,
  groupStatusDisplay,
  groupStoreFulfillments,
  mutationStatusDisplay,
  type FulfillmentAction,
  type StoreFulfillmentGroup,
} from '../../components/admin/orders/storeFulfillmentGroup'
import { useToast } from '../../components/common/Toast'
import type {
  FulfillmentDirection,
  MutationStatus,
  OrderFulfillmentMutation,
  OrderListMeta,
} from '../../types/order'
import { getApiErrorMessage } from '../../utils/apiError'

type Props = { storeId: number; onOpenOrders: () => void }
type ActionTarget = { action: FulfillmentAction; mutations: OrderFulfillmentMutation[] }

const emptyMeta: OrderListMeta = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

const actionCopy = {
  approve: {
    eyebrow: 'Kesiapan toko sumber',
    title: 'Siapkan dan kirim barang',
    description: 'Stok pesanan sudah dicadangkan saat checkout. Aksi ini menandai barang mulai dikirim ke toko tujuan.',
    confirmation: 'Saya sudah memastikan jumlah dan kondisi barang yang akan dikirim.',
    button: 'Konfirmasi kirim',
  },
  receive: {
    eyebrow: 'Gerbang penerimaan fisik',
    title: 'Konfirmasi barang tiba',
    description: 'Konfirmasi hanya setelah barang benar-benar tiba dan diperiksa. Barang tetap dialokasikan untuk pesanan ini.',
    confirmation: 'Saya sudah melihat, menghitung, dan menerima seluruh barang secara fisik.',
    button: 'Barang sudah diterima',
  },
  reject: {
    eyebrow: 'Tolak permintaan',
    title: 'Tolak mutasi stok',
    description: 'Berikan catatan agar toko peminta mengetahui alasan penolakan.',
    confirmation: '',
    button: 'Tolak permintaan',
  },
} satisfies Record<FulfillmentAction, Record<string, string>>

export default function AdminStoreFulfillmentPage({ storeId, onOpenOrders }: Props) {
  const { showToast } = useToast()
  const [fulfillments, setFulfillments] = useState<OrderFulfillmentMutation[]>([])
  const [meta, setMeta] = useState<OrderListMeta>(emptyMeta)
  const [direction, setDirection] = useState<FulfillmentDirection>('all')
  const [status, setStatus] = useState<MutationStatus | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [approvedQuantity, setApprovedQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [actionShouldClose, setActionShouldClose] = useState(false)
  const [detailGroup, setDetailGroup] = useState<StoreFulfillmentGroup | null>(null)
  const groups = useMemo(() => groupStoreFulfillments(fulfillments), [fulfillments])

  const fetchFulfillments = async () => {
    try {
      setLoading(true)
      const result = await getStoreFulfillments({
        storeId,
        page,
        limit: 50,
        direction,
        status: status || undefined,
        search: search.trim() || undefined,
      })
      setFulfillments(result.fulfillments)
      setMeta(result.meta)
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Gagal memuat daftar mutasi stok'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchFulfillments(), search ? 350 : 0)
    return () => window.clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, page, direction, status, search])

  const openAction = (action: FulfillmentAction, mutations: OrderFulfillmentMutation[]) => {
    setActionTarget({ action, mutations })
    setActionNotes('')
    setConfirmed(false)
    setActionShouldClose(false)
    setApprovedQuantity(action === 'approve' && mutations.length === 1 ? mutations[0].quantity : 1)
  }

  const closeAction = () => {
    if (submitting) return
    setActionTarget(null)
    setActionNotes('')
    setConfirmed(false)
    setActionShouldClose(false)
    setApprovedQuantity(1)
  }

  const handleAction = async () => {
    if (!actionTarget) return
    const { action, mutations } = actionTarget
    if (action !== 'reject' && !confirmed) return

    const mutationIds = mutations.map((mutation) => mutation.id)
    const isBatch = mutationIds.length > 1

    try {
      setSubmitting(true)
      if (action === 'approve') {
        if (isBatch) await approveOrderFulfillments(mutationIds, actionNotes, true)
        else await approveOrderFulfillment(mutationIds[0], actionNotes, true, approvedQuantity)
        showToast(
          isBatch
            ? `${mutationIds.length} produk dicatat siap dan dalam perjalanan`
            : `${approvedQuantity} item dicatat siap dan dalam perjalanan`,
          'success',
        )
      } else if (action === 'receive') {
        if (isBatch) await receiveOrderFulfillments(mutationIds, actionNotes, true)
        else await receiveOrderFulfillment(mutationIds[0], actionNotes, true)
        showToast(`${mutationIds.length} produk diterima dan pesanan siap dilanjutkan`, 'success')
      } else {
        if (isBatch) await rejectOrderFulfillments(mutationIds, actionNotes)
        else await rejectOrderFulfillment(mutationIds[0], actionNotes)
        showToast(`${mutationIds.length} permintaan mutasi stok ditolak`, 'success')
      }
      setActionNotes('')
      setConfirmed(false)
      setApprovedQuantity(1)
      await fetchFulfillments()
      setActionShouldClose(true)
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Gagal memproses mutasi stok'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const actionLead = actionTarget?.mutations[0]
  const actionProductCount = actionTarget?.mutations.length ?? 0
  const actionTotalQuantity = actionTarget?.mutations.reduce(
    (total, mutation) => total + mutation.quantity,
    0,
  ) ?? 0
  const isPartialApproval = Boolean(
    actionTarget?.action === 'approve' &&
    actionProductCount === 1 &&
    actionLead &&
    approvedQuantity < actionLead.quantity,
  )
  const partialRemainingQuantity = actionLead
    ? Math.max(0, actionLead.quantity - approvedQuantity)
    : 0
  const invalidApprovedQuantity = Boolean(
    actionTarget?.action === 'approve' &&
    actionProductCount === 1 &&
    actionLead &&
    (approvedQuantity < 1 || approvedQuantity > actionLead.quantity),
  )
  const detailStatus = detailGroup ? getGroupStatus(detailGroup.mutations) : null
  const detailDisplay = detailStatus ? groupStatusDisplay[detailStatus] : null
  const detailTotalQuantity = detailGroup?.mutations.reduce((total, mutation) => total + mutation.quantity, 0) ?? 0

  return (
    <div className="font-admin">
      <section className="mb-6 overflow-hidden rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm">
        <div className="flex flex-col gap-5 p-5 md:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-admin-amber" />
              <p className="m-0 text-xs font-semibold uppercase tracking-wider text-admin-amber">Catatan operasional</p>
            </div>
            <h3 className="m-0 text-lg font-bold text-admin-ink">Prosedur Mutasi Stok Antar Toko</h3>
            <p className="mb-0 mt-2 text-sm leading-6 text-admin-ink-soft">
              Admin wajib memastikan barang siap. Walaupun stok sudah tercatat berpindah di aplikasi,
              tunggu sampai barang benar-benar tiba dan diperiksa sebelum mengirim pesanan pelanggan.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenOrders}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-admin-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-admin-accent-strong"
          >
            Buat dari pesanan <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 border-t border-admin-line-soft bg-admin-surface-2/20 sm:grid-cols-3">
          {[
            ['Siapkan barang', 'Toko sumber cek stok fisik', ClipboardCheck],
            ['Kirim antar toko', 'Status dalam perjalanan', Truck],
            ['Terima dan periksa', 'Pesanan siap dilanjutkan', PackageCheck],
          ].map(([label, detail, Icon], index) => {
            const StepIcon = Icon as typeof ClipboardCheck
            return (
              <div key={label as string} className="flex items-center gap-3 border-b border-admin-line-soft p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-admin-accent-soft text-admin-accent-strong">
                  <StepIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="m-0 text-xs font-semibold text-admin-accent-strong">Tahap {index + 1}</p>
                  <p className="m-0 text-sm font-bold text-admin-ink">{label as string}</p>
                  <p className="m-0 mt-0.5 text-xs text-admin-ink-muted">{detail as string}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="m-0 text-lg font-bold text-admin-ink">Manifest Mutasi Stok</h3>
          <p className="m-0 mt-0.5 text-sm text-admin-ink-muted">
            {groups.length} pengiriman pada halaman - {meta.total} produk terkait toko ini
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={direction}
            onChange={(event) => { setDirection(event.target.value as FulfillmentDirection); setPage(1) }}
            aria-label="Filter arah mutasi stok"
            className="cursor-pointer appearance-none rounded-xl border border-admin-line bg-admin-surface px-4 py-2.5 text-sm text-admin-ink focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
          >
            <option value="all">Semua arah</option>
            <option value="incoming">Barang masuk</option>
            <option value="outgoing">Barang keluar</option>
          </select>
          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value as MutationStatus | ''); setPage(1) }}
            aria-label="Filter status mutasi stok"
            className="cursor-pointer appearance-none rounded-xl border border-admin-line bg-admin-surface px-4 py-2.5 text-sm text-admin-ink focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
          >
            <option value="">Semua status</option>
            {Object.entries(mutationStatusDisplay).map(([value, display]) => (
              <option key={value} value={value}>{display.label}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-ink-muted" />
            <input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
              placeholder="Cari pesanan, produk, atau toko"
              className="w-full rounded-xl border border-admin-line bg-admin-surface py-2.5 pl-10 pr-3.5 text-sm text-admin-ink placeholder:text-admin-ink-muted focus:outline-none focus:ring-2 focus:ring-admin-accent/30 sm:w-64"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-admin-line-soft bg-admin-surface py-16 shadow-sm">
          <Loader2 className="h-8 w-8 text-admin-accent admin-spin" />
          <p className="m-0 text-sm text-admin-ink-muted">Memuat mutasi stok...</p>
        </section>
      ) : groups.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-admin-line-soft bg-admin-surface px-5 py-16 text-center shadow-sm">
          <CheckCircle2 className="h-10 w-10 text-admin-line" />
          <p className="m-0 text-sm font-semibold text-admin-ink">Tidak ada antrean pada filter ini</p>
          <p className="m-0 text-xs text-admin-ink-muted">Permintaan baru dibuat dari pesanan toko yang membutuhkan stok.</p>
        </section>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <AdminStoreFulfillmentGroupCard
              key={group.key}
              group={group}
              storeId={storeId}
              onAction={openAction}
              onViewDetail={setDetailGroup}
            />
          ))}
        </div>
      )}

      {!loading && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-admin-line-soft bg-admin-surface px-5 py-3.5 shadow-sm">
          <button
            type="button"
            disabled={!meta.hasPreviousPage}
            onClick={() => setPage((current) => current - 1)}
            className="cursor-pointer rounded-lg border border-admin-line-soft bg-admin-surface px-3.5 py-2 text-sm text-admin-ink-soft disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span className="text-xs text-admin-ink-muted">Halaman {meta.page} dari {meta.totalPages}</span>
          <button
            type="button"
            disabled={!meta.hasNextPage}
            onClick={() => setPage((current) => current + 1)}
            className="cursor-pointer rounded-lg border border-admin-line-soft bg-admin-surface px-3.5 py-2 text-sm text-admin-ink-soft disabled:opacity-40"
          >
            Selanjutnya
          </button>
        </div>
      )}

      {detailGroup && detailDisplay && (
        <AdminModal
          onClose={() => setDetailGroup(null)}
          labelledBy="store-fulfillment-detail-title"
          maxWidthClassName="max-w-3xl"
        >
          {(closeModal) => (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-admin-line-soft px-5 py-4">
                <div className="min-w-0">
                  <p className="m-0 text-xs font-bold uppercase tracking-wider text-admin-accent-strong">
                    Detail Mutasi Stok
                  </p>
                  <h3 id="store-fulfillment-detail-title" className="m-0 mt-1 truncate text-lg font-bold text-admin-ink">
                    {detailGroup.orderNumber}
                  </h3>
                  <p className="m-0 mt-1 text-xs text-admin-ink-muted">
                    {detailGroup.mutations.length} produk - {detailTotalQuantity} item
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Tutup detail mutasi stok"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-admin-line-soft bg-admin-surface transition-colors hover:bg-admin-surface-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted">Status</span>
                    <strong className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs ${detailDisplay.className}`}>
                      {detailDisplay.label}
                    </strong>
                  </div>
                  <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted">Dari</span>
                    <strong className="mt-2 block truncate text-sm text-admin-ink">{detailGroup.sourceStore.name}</strong>
                  </div>
                  <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted">Ke</span>
                    <strong className="mt-2 block truncate text-sm text-admin-ink">{detailGroup.destinationStore.name}</strong>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-admin-line-soft bg-admin-surface">
                  <div className="grid grid-cols-[minmax(0,1fr)_90px_130px] gap-3 border-b border-admin-line-soft bg-admin-surface-2/45 px-4 py-3 text-xs font-bold uppercase tracking-wider text-admin-ink-soft">
                    <span>Produk</span>
                    <span className="text-right">Jumlah</span>
                    <span>Status</span>
                  </div>
                  <div className="divide-y divide-admin-line-soft">
                    {detailGroup.mutations.map((mutation) => {
                      const mutationDisplay = mutationStatusDisplay[mutation.status]
                      const timeline = [
                        ['Dibuat', mutation.createdAt],
                        ['Disetujui', mutation.approvedAt],
                        ['Dikirim', mutation.sentAt],
                        ['Diterima', mutation.receivedAt],
                        ['Ditolak', mutation.rejectedAt],
                      ].filter(([, value]) => Boolean(value))

                      return (
                        <article key={mutation.id} className="px-4 py-3.5">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_90px_130px] md:items-start">
                            <div className="min-w-0">
                              <strong className="block truncate text-sm text-admin-ink">{mutation.product.name}</strong>
                              {mutation.notes && (
                                <p className="m-0 mt-1 break-words text-xs leading-5 text-admin-ink-muted">{mutation.notes}</p>
                              )}
                            </div>
                            <div className="flex justify-between gap-2 md:block md:text-right">
                              <span className="text-xs text-admin-ink-muted md:hidden">Jumlah</span>
                              <strong className="text-sm text-admin-ink">{mutation.quantity}</strong>
                            </div>
                            <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${mutationDisplay.className}`}>
                              {mutationDisplay.label}
                            </span>
                          </div>

                          {timeline.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-admin-ink-muted">
                              {timeline.map(([label, value]) => (
                                <span key={`${mutation.id}-${label}`} className="rounded-full bg-admin-surface-2 px-2.5 py-1">
                                  {label}: {formatDateTime(value as string)}
                                </span>
                              ))}
                            </div>
                          )}
                        </article>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </AdminModal>
      )}
      {actionTarget && actionLead && (
        <AdminModal
          onClose={closeAction}
          busy={submitting}
          requestClose={actionShouldClose}
          labelledBy="store-fulfillment-action-title"
        >
          {(closeModal) => (
            <>
            <div className="flex items-start justify-between gap-3 border-b border-admin-line-soft px-5 py-4">
              <div>
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-admin-accent-strong">
                  {actionCopy[actionTarget.action].eyebrow}
                </p>
                <h3 id="store-fulfillment-action-title" className="m-0 mt-1 text-lg font-bold text-admin-ink">
                  {actionCopy[actionTarget.action].title}
                </h3>
                {actionProductCount > 1 && (
                  <p className="m-0 mt-1 text-xs text-admin-ink-muted">
                    Aksi massal untuk {actionProductCount} produk - {actionTotalQuantity} item
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Tutup"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-admin-line-soft bg-admin-surface disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
              <div className="overflow-hidden rounded-xl border border-admin-line-soft bg-admin-surface-2/50">
                <div className="flex items-center gap-3 border-b border-admin-line-soft px-4 py-3 text-xs text-admin-ink-muted">
                  <strong className="text-admin-ink">{actionLead.order?.orderNumber ?? 'Mutasi stok'}</strong>
                  <span>-</span>
                  <span>{actionLead.sourceStore.name} ke {actionLead.destinationStore.name}</span>
                </div>
                <div className="max-h-40 divide-y divide-admin-line-soft overflow-y-auto">
                  {actionTarget.mutations.map((mutation) => (
                    <div key={mutation.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
                      <strong className="truncate text-admin-ink">{mutation.product.name}</strong>
                      <span className="shrink-0 text-admin-ink-muted">{mutation.quantity} item</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mb-0 mt-4 text-sm leading-6 text-admin-ink-soft">
                {actionCopy[actionTarget.action].description}
              </p>
              {actionTarget.action === 'approve' && actionProductCount === 1 && (
                <div className="mt-4 rounded-xl border border-admin-line-soft bg-admin-surface-2/50 p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_140px] items-end gap-4">
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted">
                        Diminta toko tujuan
                      </span>
                      <strong className="mt-1 block text-lg text-admin-ink">
                        {actionLead.quantity} item
                      </strong>
                    </div>
                    <label>
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">
                        Jumlah dikirim
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={actionLead.quantity}
                        value={approvedQuantity}
                        onChange={(event) => setApprovedQuantity(Number(event.target.value))}
                        className="w-full rounded-xl border border-admin-line bg-admin-surface px-3.5 py-2.5 text-sm font-bold text-admin-ink focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
                      />
                    </label>
                  </div>
                  {isPartialApproval && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-admin-amber/20 bg-admin-amber-soft/60 px-3 py-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-admin-amber" />
                      <p className="m-0 text-xs leading-5 text-admin-ink-soft">
                        {partialRemainingQuantity} item sisanya akan ditolak otomatis. Toko tujuan harus meminta sisa tersebut ke toko sumber lain.
                      </p>
                    </div>
                  )}
                  <p className="m-0 mt-2 text-xs text-admin-ink-muted">
                    Jika tidak dapat mengirim satu pun, tutup dialog lalu gunakan <strong>Tolak item</strong>.
                  </p>
                </div>
              )}
              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">Catatan aksi</span>
                <textarea
                  value={actionNotes}
                  onChange={(event) => setActionNotes(event.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Tambahkan catatan bila diperlukan"
                  className="w-full resize-none rounded-xl border border-admin-line bg-admin-surface px-3.5 py-3 text-sm text-admin-ink placeholder:text-admin-ink-muted focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
                />
              </label>
              {actionCopy[actionTarget.action].confirmation && (
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-admin-amber/25 bg-admin-amber-soft/60 p-3.5">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-admin-accent"
                  />
                  <span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-admin-ink">
                      <AlertTriangle className="h-3.5 w-3.5 text-admin-amber" /> Konfirmasi wajib
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-admin-ink-soft">
                      {actionCopy[actionTarget.action].confirmation}
                    </span>
                  </span>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-admin-line-soft px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="cursor-pointer rounded-xl border border-admin-line bg-admin-surface px-4 py-2.5 text-sm font-semibold text-admin-ink-soft disabled:opacity-40"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleAction()}
                disabled={submitting || invalidApprovedQuantity || Boolean(actionCopy[actionTarget.action].confirmation && !confirmed)}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border-none px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 ${actionTarget.action === 'reject' ? 'bg-admin-red' : actionTarget.action === 'receive' ? 'bg-admin-green' : 'bg-admin-accent'}`}
              >
                {submitting
                  ? <Loader2 className="h-4 w-4 admin-spin" />
                  : actionTarget.action === 'reject'
                    ? <XCircle className="h-4 w-4" />
                    : <CheckCircle2 className="h-4 w-4" />}
                {actionCopy[actionTarget.action].button}
                {actionProductCount > 1
                  ? ` (${actionProductCount} produk)`
                  : actionTarget.action === 'approve'
                    ? ` (${approvedQuantity} item)`
                    : ''}
              </button>
            </div>
            </>
          )}
        </AdminModal>
      )}
    </div>
  )
}
