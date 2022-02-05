import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { date, option as tOption } from 'io-ts-types'
import { either, option } from 'fp-ts'
import { validate as isEmail } from 'isemail'
import { Option } from 'fp-ts/Option'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'

const sqlDatePattern = /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})$/

export const DateFromSQLDate: t.Type<Date, string> = new t.Type(
  'DateFromSQLDate',
  date.is,
  (u, c) =>
    pipe(
      t.string.validate(u, c),
      either.chain(s => {
        if (!sqlDatePattern.test(s)) {
          return t.failure(u, c)
        }

        const [, year, month, day, hours, minutes, seconds] = s
          .match(sqlDatePattern)!
          .map(s => parseInt(s))

        return t.success(
          new Date(year, month - 1, day, hours, minutes, seconds)
        )
      })
    ),
  date => {
    const leadZero = (n: number): string => (n < 10 ? '0' : '') + n
    const year = date.getFullYear()
    const month = leadZero(date.getMonth() + 1)
    const day = leadZero(date.getDate())
    const hours = leadZero(date.getHours())
    const minutes = leadZero(date.getMinutes())
    const seconds = leadZero(date.getSeconds())

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }
)
export type DateFromSQLDate = t.TypeOf<typeof DateFromSQLDate>

interface PositiveIntegerBrand {
  readonly PositiveInteger: unique symbol
}

export const PositiveInteger = t.brand(
  t.Int,
  (n): n is t.Branded<t.Int, PositiveIntegerBrand> => n > 0,
  'PositiveInteger'
)
export type PositiveInteger = t.TypeOf<typeof PositiveInteger>

export const NonNegativeInteger = t.union(
  [PositiveInteger, t.literal(0)],
  'NonNegativeInteger'
)
export type NonNegativeInteger = t.TypeOf<typeof NonNegativeInteger>

interface EmailStringBrand {
  readonly EmailString: unique symbol
}

export const EmailString = t.brand(
  t.string,
  (s): s is t.Branded<string, EmailStringBrand> => isEmail(s),
  'EmailString'
)
export type EmailString = t.TypeOf<typeof EmailString>

interface NonNegativeNumberBrand {
  readonly NonNegativeNumber: unique symbol
}

export const NonNegativeNumber = t.brand(
  t.number,
  (n): n is t.Branded<number, NonNegativeNumberBrand> => n >= 0,
  'NonNegativeNumber'
)
export type NonNegativeNumber = t.TypeOf<typeof NonNegativeNumber>

interface PercentageBrand {
  readonly Percentage: unique symbol
}

export const Percentage = t.brand(
  t.number,
  (n): n is t.Branded<number, PercentageBrand> => n >= 0 && n <= 1,
  'Percentage'
)
export type Percentage = t.TypeOf<typeof Percentage>

export const EmptyObject = t.type({})
export type EmptyObject = t.TypeOf<typeof EmptyObject>

export type LocalizedStringBrand = string & {
  readonly LocalizedString: unique symbol
}

export const LocalizedString = t.brand(
  t.string,
  (_): _ is t.Branded<string, LocalizedStringBrand> => true,
  'LocalizedString'
)

export type LocalizedString = t.TypeOf<typeof LocalizedString>

const CoolerErrorType = t.keyof({
  COOLER_400: true,
  COOLER_401: true,
  COOLER_403: true,
  COOLER_404: true,
  COOLER_409: true,
  COOLER_500: true
})
type CoolerErrorType = t.TypeOf<typeof CoolerErrorType>

export function foldCoolerErrorType<T>(
  cases: Record<CoolerErrorType, IO<T>>
): Reader<CoolerErrorType, T> {
  return errorType => cases[errorType]()
}

export const CoolerError = t.type(
  {
    code: CoolerErrorType,
    message: LocalizedString,
    extras: t.record(t.string, t.unknown)
  },
  'CoolerError'
)
export type CoolerError = t.TypeOf<typeof CoolerError>

export function coolerError(
  code: CoolerErrorType,
  message: LocalizedString,
  extras?: Record<string, any>
): CoolerError {
  return { code, message, extras: extras || {} }
}

export interface OptionFromNull<C extends t.Mixed>
  extends t.Type<Option<t.TypeOf<C>>, t.OutputOf<C> | null, unknown> {}

export function optionFromNull<C extends t.Mixed>(
  codec: C,
  name: string = `Option<${codec.name}>`
) {
  return new t.Type(
    name,
    tOption(codec).is,
    (u, c) =>
      u === null
        ? t.success(option.none)
        : pipe(codec.validate(u, c), either.map(option.some)),
    a => pipe(a, option.map(codec.encode), option.toNullable)
  )
}

export interface OptionFromUndefinedC<C extends t.Mixed>
  extends t.Type<Option<t.TypeOf<C>>, t.OutputOf<C> | undefined, unknown> {}

export function optionFromUndefined<C extends t.Mixed>(
  codec: C,
  name: string = `Option<${codec.name}>`
) {
  return new t.Type(
    name,
    tOption(codec).is,
    (u, c) =>
      u === undefined
        ? t.success(option.none)
        : pipe(codec.validate(u, c), either.map(option.some)),
    a => pipe(a, option.map(codec.encode), option.toUndefined)
  )
}

export function isObject(u: unknown): u is Object {
  return Object.prototype.toString.call(u) === '[object Object]'
}
