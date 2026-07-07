import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getOrderCalendarDays,
  getOrderDateDisplay,
  getOrderMonthTitle,
  getOrderVisibleMonth,
  isOrderSameDay,
  isOrderSameMonth,
  orderDateWeekdayLabels,
  parseOrderDateValue,
  shiftOrderMonth,
  toOrderDateValue,
} from './orderDatePickerUtils'

type OrdersDatePickerProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

export function OrdersDatePicker({ label, value, onChange }: OrdersDatePickerProps) {
  const labelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => getOrderVisibleMonth(value))

  const selectedDate = useMemo(() => parseOrderDateValue(value), [value])
  const calendarDays = useMemo(() => getOrderCalendarDays(visibleMonth), [visibleMonth])
  const displayValue = getOrderDateDisplay(value)

  useEffect(() => {
    if (!isOpen) setVisibleMonth(getOrderVisibleMonth(value))
  }, [isOpen, value])

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  const openPicker = () => {
    setVisibleMonth(getOrderVisibleMonth(value))
    setIsOpen((current) => !current)
  }

  const selectDate = (date: Date) => {
    onChange(toOrderDateValue(date))
    setIsOpen(false)
  }

  const selectToday = () => {
    const today = new Date()
    onChange(toOrderDateValue(today))
    setVisibleMonth(getOrderVisibleMonth(toOrderDateValue(today)))
    setIsOpen(false)
  }

  const clearDate = () => {
    onChange('')
    setIsOpen(false)
  }

  return (
    <div className="orders-filter-field orders-date-field" ref={rootRef}>
      <span id={labelId}>{label}</span>
      <button
        type="button"
        className={`orders-input-shell orders-date-trigger ${displayValue ? 'has-value' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-labelledby={labelId}
        onClick={openPicker}
      >
        <CalendarDays aria-hidden="true" />
        <span className="orders-date-trigger-text">
          {displayValue || 'Pilih tanggal'}
        </span>
      </button>

      {isOpen && (
        <div className="orders-date-popover" role="dialog" aria-label={`Kalender ${label}`}>
          <div className="orders-date-header">
            <button
              type="button"
              className="orders-date-nav"
              aria-label="Bulan sebelumnya"
              onClick={() => setVisibleMonth((month) => shiftOrderMonth(month, -1))}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <strong>{getOrderMonthTitle(visibleMonth)}</strong>
            <button
              type="button"
              className="orders-date-nav"
              aria-label="Bulan berikutnya"
              onClick={() => setVisibleMonth((month) => shiftOrderMonth(month, 1))}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>

          <div className="orders-date-weekdays" aria-hidden="true">
            {orderDateWeekdayLabels.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="orders-date-grid">
            {calendarDays.map((date) => {
              const isSelected = isOrderSameDay(selectedDate, date)
              const isToday = toOrderDateValue(date) === toOrderDateValue(new Date())
              const dayClassName = [
                'orders-date-day',
                isOrderSameMonth(date, visibleMonth) ? '' : 'muted',
                isSelected ? 'selected' : '',
                isToday ? 'today' : '',
              ].filter(Boolean).join(' ')

              return (
                <button
                  key={toOrderDateValue(date)}
                  type="button"
                  className={dayClassName}
                  aria-pressed={isSelected}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="orders-date-footer">
            <button type="button" className="orders-date-link" disabled={!value} onClick={clearDate}>
              Hapus
            </button>
            <button type="button" className="orders-date-link" onClick={selectToday}>
              Hari ini
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
