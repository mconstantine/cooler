import { either, option } from 'fp-ts'
import { flow, identity, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import * as t from 'io-ts'
import { IntFromString, NonEmptyString, NumberFromString } from 'io-ts-types'
import { validate as isEmail } from 'isemail'
import { option as tOption } from 'io-ts-types/option'

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

export function unsafeEmailString(s: string): EmailString {
  return s as EmailString
}

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

export const Size = t.keyof(
  {
    large: true,
    medium: true,
    small: true
  },
  'Size'
)
export type Size = t.TypeOf<typeof Size>

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

export const PositiveIntegerFromString: t.Type<
  PositiveInteger,
  string,
  unknown
> = new t.Type(
  'PositiveIntegerFromString',
  PositiveInteger.is,
  (u, c) =>
    pipe(
      IntFromString.decode(u),
      either.chain(n =>
        n > 0 ? t.success(n as PositiveInteger) : t.failure(u, c)
      )
    ),
  n => n.toString(10)
)
export type PositiveIntegerFromString = t.TypeOf<
  typeof PositiveIntegerFromString
>

export function unsafePositiveInteger(n: number): PositiveInteger {
  return n as PositiveInteger
}

interface NonNegativeIntegerBrand {
  readonly NonNegativeInteger: unique symbol
}

export const NonNegativeInteger = t.brand(
  t.Int,
  (n): n is t.Branded<t.Int, NonNegativeIntegerBrand> => n >= 0,
  'NonNegativeInteger'
)
export type NonNegativeInteger = t.TypeOf<typeof NonNegativeInteger>

export function unsafeNonNegativeInteger(n: number): NonNegativeInteger {
  return Math.abs(n) as NonNegativeInteger
}

export const NonNegativeIntegerFromString: t.Type<
  NonNegativeInteger,
  string,
  unknown
> = new t.Type(
  'NonNegativeIntegerFromString',
  NonNegativeInteger.is,
  (u, c) =>
    pipe(
      IntFromString.decode(u),
      either.chain(n =>
        n >= 0 ? t.success(n as NonNegativeInteger) : t.failure(u, c)
      )
    ),
  n => n.toString(10)
)
export type NonNegativeIntegerFromString = t.TypeOf<
  typeof NonNegativeIntegerFromString
>

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

export const OptionFromEmptyString: t.Type<
  Option<NonEmptyString>,
  string
> = new t.Type(
  'OptionFromEmptyString',
  tOption(NonEmptyString).is,
  flow(
    NonEmptyString.decode,
    either.fold(() => t.success(option.none), flow(option.some, t.success))
  ),
  flow(option.fold(() => '', identity))
)

export function unsafePercentage(n: number): Percentage {
  return n as Percentage
}
