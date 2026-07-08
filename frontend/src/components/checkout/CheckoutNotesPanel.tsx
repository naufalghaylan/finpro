import { StickyNote } from 'lucide-react'
import { CheckoutSectionTitle } from './CheckoutSectionTitle'

type CheckoutNotesPanelProps = {
  notes: string
  onNotesChange: (notes: string) => void
}

export function CheckoutNotesPanel({ notes, onNotesChange }: CheckoutNotesPanelProps) {
  return (
    <section className="checkout-panel">
      <CheckoutSectionTitle icon={StickyNote} title="Catatan Pesanan" description="Opsional, maksimal 500 karakter." />
      <textarea
        className="checkout-notes"
        value={notes}
        maxLength={500}
        rows={4}
        placeholder="Contoh: tolong kirim sore hari."
        onChange={(event) => onNotesChange(event.target.value)}
      />
    </section>
  )
}
