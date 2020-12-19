import { either } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { NonEmptyString, NumberFromString } from 'io-ts-types'
import { validate as isEmail } from 'isemail'

export type LocalizedStringBrand = string & {
  readonly LocalizedString: unique symbol
}

export const LocalizedString = t.brand(
  t.string,
  (_): _ is t.Branded<string, LocalizedStringBrand> => true,
  'LocalizedString'
)
export type LocalizedString = t.TypeOf<typeof LocalizedString>

interface EmailStringBrand {
  readonly EmailString: unique symbol
}

export const EmailString = t.brand(
  t.string,
  (s): s is t.Branded<string, EmailStringBrand> => isEmail(s),
  'EmailString'
)
export type EmailString = t.TypeOf<typeof EmailString>

export const Color = t.keyof(
  {
    default: true,
    primary: true,
    success: true,
    warning: true,
    danger: true
  },
  'Color'
)
export type Color = t.TypeOf<typeof Color>

export function unsafeNonEmptyString(s: string): NonEmptyString {
  return s as NonEmptyString
}

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

interface NonNegativeNumberBrand {
  readonly NonNegativeNumber: unique symbol
}

export const NonNegativeNumber = t.brand(
  t.number,
  (n): n is t.Branded<number, NonNegativeNumberBrand> => n >= 0,
  'NonNegativeNumber'
)
export type NonNegativeNumber = t.TypeOf<typeof NonNegativeNumber>

export const NonNegativeNumberFromString: t.Type<
  NonNegativeNumber,
  string,
  unknown
> = new t.Type(
  'NonNegativeNumberFromString',
  NonNegativeNumber.is,
  (u, c) =>
    pipe(
      NumberFromString.decode(u),
      either.chain(n =>
        n >= 0 ? t.success(n as NonNegativeNumber) : t.failure(u, c)
      )
    ),
  n => n.toString(10)
)
export type NonNegativeNumberFromString = t.TypeOf<
  typeof NonNegativeNumberFromString
>

export function unsafeNonNegativeNumber(n: number): NonNegativeNumber {
  return Math.abs(n) as NonNegativeNumber
}

interface PercentageBrand {
  readonly Percentage: unique symbol
}

export const Percentage = t.brand(
  t.number,
  (n): n is t.Branded<number, PercentageBrand> => n >= 0 && n <= 1,
  'Percentage'
)
export type Percentage = t.TypeOf<typeof Percentage>

export const PercentageFromString: t.Type<
  Percentage,
  string,
  unknown
> = new t.Type(
  'PercentageFromString',
  Percentage.is,
  (u, c) =>
    pipe(
      NumberFromString.decode(u),
      either.map(n => n / 100),
      either.chain(n =>
        n >= 0 && n <= 1 ? t.success(n as Percentage) : t.failure(u, c)
      )
    ),
  n => (n * 100).toString()
)
export type PercentageFromString = t.TypeOf<typeof PercentageFromString>

export function unsafePercentage(n: number): Percentage {
  return n as Percentage
}
