export const orderDateWeekdayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export const orderDateMonthLabels = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const dateValuePattern = /^(\d{4})-(\d{2})-(\d{2})$/

const padDatePart = (value: number) => String(value).padStart(2, '0')

export const toOrderDateValue = (date: Date) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`

export const parseOrderDateValue = (value: string) => {
  const match = dateValuePattern.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, monthIndex, day)

  return date.getFullYear() === year && date.getMonth() === monthIndex && date.getDate() === day
    ? date
    : null
}

export const getOrderDateDisplay = (value: string) => {
  const date = parseOrderDateValue(value)
  if (!date) return ''

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const getOrderMonthTitle = (date: Date) =>
  `${orderDateMonthLabels[date.getMonth()]} ${date.getFullYear()}`

export const getOrderVisibleMonth = (value: string) => {
  const selectedDate = parseOrderDateValue(value) ?? new Date()
  return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
}

export const shiftOrderMonth = (date: Date, monthDelta: number) =>
  new Date(date.getFullYear(), date.getMonth() + monthDelta, 1)

export const getOrderCalendarDays = (visibleMonth: Date) => {
  const firstDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
  const startDate = new Date(firstDate)
  startDate.setDate(firstDate.getDate() - firstDate.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    return date
  })
}

export const isOrderSameMonth = (date: Date, visibleMonth: Date) =>
  date.getMonth() === visibleMonth.getMonth() && date.getFullYear() === visibleMonth.getFullYear()

export const isOrderSameDay = (firstDate: Date | null, secondDate: Date) => {
  if (!firstDate) return false
  return toOrderDateValue(firstDate) === toOrderDateValue(secondDate)
}
