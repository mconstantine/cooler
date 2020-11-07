import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { date } from 'io-ts-types'
import { either } from 'fp-ts'
import { validate as isEmail } from 'isemail'
import { ApolloError } from 'apollo-server-express'

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

const CoolerErrorType = t.keyof({
  COOLER_400: true,
  COOLER_401: true,
  COOLER_403: true,
  COOLER_404: true,
  COOLER_409: true,
  COOLER_500: true
})
type CoolerErrorType = t.TypeOf<typeof CoolerErrorType>

export function coolerError(
  type: CoolerErrorType,
  message: string,
  extras?: Record<string, any>
): ApolloError {
  return new ApolloError(message, type, extras)
}
