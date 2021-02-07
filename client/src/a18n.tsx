import originalA18n, { LocaleResource } from 'a18n'
import { pipe } from 'fp-ts/function'
import { LocalizedString, Month } from './globalDomain'

interface A18n {
  (text: string): LocalizedString
  (parts: TemplateStringsArray, ...values: (string | number)[]): LocalizedString
  x(parts: TemplateStringsArray, ...values: any[]): any[]
  addLocaleResource(locale: string, resource: LocaleResource): void
  setLocale(locale: string): void
  getLocale(): string
  getA18n(namespace: string): A18n
}

export const a18n: A18n = (originalA18n as unknown) as A18n

export function unsafeLocalizedString(s: string): LocalizedString {
  return s as LocalizedString
}

const date = new Date()
date.setDate(1)
date.setMonth(0)
const january = date.toLocaleDateString(undefined, { month: 'long' })
date.setMonth(1)
const february = date.toLocaleDateString(undefined, { month: 'long' })
date.setMonth(2)
const march = date.toLocaleDateString(undefined, { month: 'long' })
date.setMonth(3)
const april = date.toLocaleDateString(undefined, { month: 'long' })
date.setMonth(4)
const may = date.toLocaleDateString(undefined, { month: 'long' })
date.setMonth(5)
const june = date.toLocaleDateString(undefined, { month: 'long' })
date.setMonth(6)
const july = date.toLocaleDateString(undefined, { month: 'long' })
date.setMonth(7)
const august = date.toLocaleDateString(undefined, { month: 'long' })
date.setMonth(8)
const september = date.toLocaleDateString(undefined, { month: 'long' })
date.setMonth(9)
const october = date.toLocaleDateString(undefined, { month: 'long' })
date.setMonth(10)
const november = date.toLocaleDateString(undefined, { month: 'long' })
date.setMonth(11)
const december = date.toLocaleDateString(undefined, { month: 'long' })

export const localizedMonthNames: Record<Month, LocalizedString> = {
  0: january as LocalizedString,
  1: february as LocalizedString,
  2: march as LocalizedString,
  3: april as LocalizedString,
  4: may as LocalizedString,
  5: june as LocalizedString,
  6: july as LocalizedString,
  7: august as LocalizedString,
  8: september as LocalizedString,
  9: october as LocalizedString,
  10: november as LocalizedString,
  11: december as LocalizedString
}

export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {}
): LocalizedString {
  return date.toLocaleDateString(a18n.getLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  }) as LocalizedString
}

export function formatTime(
  date: Date,
  options: Intl.DateTimeFormatOptions = {}
): LocalizedString {
  return date.toLocaleTimeString(a18n.getLocale(), {
    hour: 'numeric',
    minute: 'numeric',
    ...options
  }) as LocalizedString
}

export function formatDateTime(
  date: Date,
  options: Intl.DateTimeFormatOptions = {}
): LocalizedString {
  return date.toLocaleDateString(a18n.getLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    ...options
  }) as LocalizedString
}

function leadZero(n: number): string {
  return (n >= 0 && n < 10 ? '0' : '') + n
}

export function formatDuration(
  durationMs: number,
  showSeconds = false
): LocalizedString {
  const duration = Math.abs(durationMs)
  const hours = Math.floor(duration / 3600000)

  const minutes = showSeconds
    ? Math.floor((duration - hours * 3600000) / 60000)
    : Math.ceil((duration - hours * 3600000) / 60000)

  const secondsString = showSeconds
    ? ':' +
      leadZero(Math.ceil((duration - hours * 3600000 - minutes * 60000) / 1000))
    : ''

  const sign = durationMs < 0 ? '-' : ''

  return unsafeLocalizedString(
    `${sign}${leadZero(hours)}:${leadZero(minutes)}${secondsString}`
  )
}

export function formatNumber(
  n: number,
  formatDecimals = false
): LocalizedString {
  return (formatDecimals || n % 1 !== 0
    ? n.toFixed(2)
    : n.toString()) as LocalizedString
}

export function formatMoneyAmount(moneyAmount: number): LocalizedString {
  return pipe(
    moneyAmount,
    n => formatNumber(Math.abs(n), true),
    s => (moneyAmount >= 0 ? `€${s}` : `-€${s}`),
    unsafeLocalizedString
  )
}
