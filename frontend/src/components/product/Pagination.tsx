type PaginationProps = {
  currentPage: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

/** Kontrol pagination sederhana. Tidak dirender bila hanya ada satu halaman. */
export function Pagination({ currentPage, totalPages, onPrev, onNext }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
      <button className="button ghost" disabled={currentPage === 1} onClick={onPrev}>
        ← Sebelumnya
      </button>
      <span style={{ padding: '10px 16px', color: 'var(--ink-soft)' }}>
        Halaman {currentPage} dari {totalPages}
      </span>
      <button className="button ghost" disabled={currentPage === totalPages} onClick={onNext}>
        Selanjutnya →
      </button>
    </div>
  )
}
