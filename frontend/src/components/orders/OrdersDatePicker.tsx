import type { Dispatch, RefObject, SetStateAction } from 'react'
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

type DatePickerState = {
  isOpen: boolean
  visibleMonth: Date
  selectedDate: Date | null
  calendarDays: Date[]
  displayValue: string
  setIsOpen: Dispatch<SetStateAction<boolean>>
  setVisibleMonth: Dispatch<SetStateAction<Date>>
}

type DatePickerActions = {
  openPicker: () => void
  selectDate: (date: Date) => void
  selectToday: () => void
  clearDate: () => void
  shiftMonth: (monthDelta: number) => void
}

type DatePickerShellProps = OrdersDatePickerProps & {
  labelId: string
  rootRef: RefObject<HTMLDivElement | null>
  state: DatePickerState
  actions: DatePickerActions
}

export function OrdersDatePicker({ label, value, onChange }: OrdersDatePickerProps) {
  const labelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const state = useOrdersDatePickerState(value)
  const actions = useOrdersDatePickerActions(value, onChange, state)
  useCloseDatePickerOnOutsideClick(state.isOpen, rootRef, state.setIsOpen)

  return <OrdersDatePickerShell label={label} labelId={labelId} rootRef={rootRef} value={value} onChange={onChange} state={state} actions={actions} />
}

function useOrdersDatePickerState(value: string) {
  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => getOrderVisibleMonth(value))
  const selectedDate = useMemo(() => parseOrderDateValue(value), [value])
  const calendarDays = useMemo(() => getOrderCalendarDays(visibleMonth), [visibleMonth])

  return { isOpen, visibleMonth, selectedDate, calendarDays, displayValue: getOrderDateDisplay(value), setIsOpen, setVisibleMonth }
}

function useCloseDatePickerOnOutsideClick(isOpen: boolean, rootRef: RefObject<HTMLDivElement | null>, setIsOpen: Dispatch<SetStateAction<boolean>>) {
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
    return () => removeDatePickerListeners(closeOnOutsideClick, closeOnEscape)
  }, [isOpen, rootRef, setIsOpen])
}

function removeDatePickerListeners(closeOnOutsideClick: (event: MouseEvent) => void, closeOnEscape: (event: KeyboardEvent) => void) {
  document.removeEventListener('mousedown', closeOnOutsideClick)
  document.removeEventListener('keydown', closeOnEscape)
}

function useOrdersDatePickerActions(value: string, onChange: (value: string) => void, state: DatePickerState) {
  const openPicker = createOpenPicker(value, state.setVisibleMonth, state.setIsOpen)
  const selectDate = createSelectDate(onChange, state.setIsOpen)
  const selectToday = createSelectToday(onChange, state.setVisibleMonth, state.setIsOpen)
  const clearDate = createClearDate(onChange, state.setIsOpen)
  const shiftMonth = createShiftMonth(state.setVisibleMonth)
  return { openPicker, selectDate, selectToday, clearDate, shiftMonth }
}

const createOpenPicker = (value: string, setVisibleMonth: Dispatch<SetStateAction<Date>>, setIsOpen: Dispatch<SetStateAction<boolean>>) => () => {
  setVisibleMonth(getOrderVisibleMonth(value))
  setIsOpen((current) => !current)
}

const createSelectDate = (onChange: (value: string) => void, setIsOpen: Dispatch<SetStateAction<boolean>>) => (date: Date) => {
  onChange(toOrderDateValue(date))
  setIsOpen(false)
}

const createSelectToday = (onChange: (value: string) => void, setVisibleMonth: Dispatch<SetStateAction<Date>>, setIsOpen: Dispatch<SetStateAction<boolean>>) => () => {
  const todayValue = toOrderDateValue(new Date())
  onChange(todayValue)
  setVisibleMonth(getOrderVisibleMonth(todayValue))
  setIsOpen(false)
}

const createClearDate = (onChange: (value: string) => void, setIsOpen: Dispatch<SetStateAction<boolean>>) => () => {
  onChange('')
  setIsOpen(false)
}

const createShiftMonth = (setVisibleMonth: Dispatch<SetStateAction<Date>>) => (monthDelta: number) =>
  setVisibleMonth((month) => shiftOrderMonth(month, monthDelta))

function OrdersDatePickerShell({ label, value, labelId, rootRef, state, actions }: DatePickerShellProps) {
  return (
    <div className="orders-filter-field orders-date-field" ref={rootRef}>
      <span id={labelId}>{label}</span>
      <OrdersDateTrigger labelId={labelId} displayValue={state.displayValue} isOpen={state.isOpen} onClick={actions.openPicker} />
      {state.isOpen && <OrdersDatePopover label={label} value={value} state={state} actions={actions} />}
    </div>
  )
}

function OrdersDateTrigger({ labelId, displayValue, isOpen, onClick }: { labelId: string; displayValue: string; isOpen: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`orders-input-shell orders-date-trigger ${displayValue ? 'has-value' : ''}`} aria-expanded={isOpen} aria-haspopup="dialog" aria-labelledby={labelId} onClick={onClick}>
      <CalendarDays aria-hidden="true" />
      <span className="orders-date-trigger-text">{displayValue || 'Pilih tanggal'}</span>
    </button>
  )
}

function OrdersDatePopover({ label, value, state, actions }: { label: string; value: string; state: DatePickerState; actions: DatePickerActions }) {
  return (
    <div className="orders-date-popover" role="dialog" aria-label={`Kalender ${label}`}>
      <OrdersDateHeader visibleMonth={state.visibleMonth} shiftMonth={actions.shiftMonth} />
      <OrdersDateWeekdays />
      <OrdersDateGrid state={state} selectDate={actions.selectDate} />
      <OrdersDateFooter value={value} clearDate={actions.clearDate} selectToday={actions.selectToday} />
    </div>
  )
}

function OrdersDateHeader({ visibleMonth, shiftMonth }: { visibleMonth: Date; shiftMonth: (monthDelta: number) => void }) {
  return (
    <div className="orders-date-header">
      <button type="button" className="orders-date-nav" aria-label="Bulan sebelumnya" onClick={() => shiftMonth(-1)}><ChevronLeft aria-hidden="true" /></button>
      <strong>{getOrderMonthTitle(visibleMonth)}</strong>
      <button type="button" className="orders-date-nav" aria-label="Bulan berikutnya" onClick={() => shiftMonth(1)}><ChevronRight aria-hidden="true" /></button>
    </div>
  )
}

function OrdersDateWeekdays() {
  return (
    <div className="orders-date-weekdays" aria-hidden="true">
      {orderDateWeekdayLabels.map((weekday) => <span key={weekday}>{weekday}</span>)}
    </div>
  )
}

function OrdersDateGrid({ state, selectDate }: { state: DatePickerState; selectDate: (date: Date) => void }) {
  return (
    <div className="orders-date-grid">
      {state.calendarDays.map((date) => <OrdersDateDay key={toOrderDateValue(date)} date={date} state={state} selectDate={selectDate} />)}
    </div>
  )
}

const getOrderDateDayClassName = (date: Date, state: DatePickerState) => [
  'orders-date-day',
  isOrderSameMonth(date, state.visibleMonth) ? '' : 'muted',
  isOrderSameDay(state.selectedDate, date) ? 'selected' : '',
  toOrderDateValue(date) === toOrderDateValue(new Date()) ? 'today' : '',
].filter(Boolean).join(' ')

function OrdersDateDay({ date, state, selectDate }: { date: Date; state: DatePickerState; selectDate: (date: Date) => void }) {
  return (
    <button type="button" className={getOrderDateDayClassName(date, state)} aria-pressed={isOrderSameDay(state.selectedDate, date)} onClick={() => selectDate(date)}>
      {date.getDate()}
    </button>
  )
}

function OrdersDateFooter({ value, clearDate, selectToday }: { value: string; clearDate: () => void; selectToday: () => void }) {
  return (
    <div className="orders-date-footer">
      <button type="button" className="orders-date-link" disabled={!value} onClick={clearDate}>Hapus</button>
      <button type="button" className="orders-date-link" onClick={selectToday}>Hari ini</button>
    </div>
  )
}
