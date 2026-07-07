import { Loader2, Send } from 'lucide-react'

type Props = {
  requestCount: number
  totalRequestQuantity: number
  submittingKey: string | null
  canSubmitRequests: boolean
  onSubmit: () => Promise<void> | void
}

export function FulfillmentRequestFooter({
  requestCount,
  totalRequestQuantity,
  submittingKey,
  canSubmitRequests,
  onSubmit,
}: Props) {
  if (requestCount === 0) return null

  return (
    <footer className="sticky bottom-0 z-10 flex shrink-0 flex-col gap-3 border-t border-admin-line-soft bg-admin-surface/95 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-6">
      <div>
        <strong className="block text-sm text-admin-ink">
          {requestCount} produk - {totalRequestQuantity} item
        </strong>
        <span className="text-xs text-admin-ink-muted">
          Semua permintaan dibuat bersama dalam satu proses.
        </span>
      </div>
      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={Boolean(submittingKey) || !canSubmitRequests}
        className="inline-flex min-w-[220px] cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-admin-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-admin-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submittingKey === 'request-batch' ? (
          <Loader2 className="h-4 w-4 admin-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Buat Semua Permintaan
      </button>
    </footer>
  )
}
