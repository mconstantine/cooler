import { boolean, either, option } from 'fp-ts'
import { flow, identity, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import * as t from 'io-ts'
import { IntFromString, NonEmptyString, NumberFromString } from 'io-ts-types'
import { validate as isEmail } from 'isemail'
import { option as tOption } from 'io-ts-types/option'
import { unsafeLocalizedString } from './a18n'

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
  return pipe(
    EmailString.decode(s),
    either.fold(() => {
      throw new Error('Called unsafeEmailString with invalid EmailString')
    }, identity)
  )
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
  return pipe(
    NonEmptyString.decode(s),
    either.fold(() => {
      throw new Error('Called unsafeNonEmptyString with empty string')
    }, identity)
  )
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
  return pipe(
    PositiveInteger.decode(n),
    either.fold(() => {
      throw new Error(
        'Called unsafePositiveInteger with invalid PositiveInteger'
      )
    }, identity)
  )
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
  return pipe(
    NonNegativeInteger.decode(n),
    either.fold(() => {
      throw new Error(
        'Called unsafeNonNegativeInteger with invalid NonNegativeInteger'
      )
    }, identity)
  )
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
  return pipe(
    NonNegativeNumber.decode(n),
    either.fold(() => {
      throw new Error(
        'Called unsafeNonNegativeNumber with invalid NonNegativeNumber'
      )
    }, identity)
  )
}

interface PercentageBrand {
  readonly Percentage: unique symbol
}

export const Percentage = t.brand(
  t.number,
  (n): n is t.Branded<number, PercentageBrand> => n >= 0,
  'Percentage'
)
export type Percentage = t.TypeOf<typeof Percentage>

export const PercentageFromString: t.Type<Percentage, string, unknown> =
  new t.Type(
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
    n => (n * 100).toFixed(2)
  )
export type PercentageFromString = t.TypeOf<typeof PercentageFromString>

export function unsafePercentage(n: number): Percentage {
  return pipe(
    Percentage.decode(n),
    either.fold(() => {
      throw new Error('Called unsafePercentage with invalid Percentage')
    }, identity)
  )
}

export function computePercentage(whole: number, fraction: number): Percentage {
  if (whole === 0) {
    return unsafePercentage(0)
  }

  return unsafePercentage(fraction / whole)
}

export function formatPercentarge(n: Percentage): LocalizedString {
  return pipe(
    n,
    PercentageFromString.encode,
    s => `${s}%`,
    unsafeLocalizedString
  )
}

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
  option.fold(() => '', identity)
)

export function optionFromUndefined<T extends t.Mixed>(
  codec: T,
  name?: string
): t.Type<Option<T>, T | undefined> {
  return new t.Type(
    `OptionFromUndefined<${name}>`,
    tOption(codec).is,
    u =>
      pipe(
        u === undefined,
        boolean.fold(
          () => pipe(codec.decode(u), either.map(option.some)),
          () => t.success(option.none as Option<T>)
        )
      ),
    option.fold(() => undefined, identity)
  )
}

function NumberHigherThan<T extends number>(
  min: number,
  T: t.Type<T, number, unknown>
): t.Type<T, number, unknown> {
  return new t.Type(
    `${T.name}HigherThan${min}`,
    T.is,
    (u, c) =>
      pipe(
        T.decode(u),
        either.chain(n => (n > min ? t.success(n as T) : t.failure(u, c)))
      ),
    identity
  )
}

function NumberFromStringHigherThan<T extends number>(
  min: number,
  T: t.Type<T, string, unknown>
): t.Type<T, string, unknown> {
  return new t.Type(
    `${T.name}FromStringHigherThan${min}`,
    T.is,
    (u, c) =>
      pipe(
        T.decode(u),
        either.chain(n => (n > min ? t.success(n as T) : t.failure(u, c)))
      ),
    n => n.toString(10)
  )
}

function NumberLowerThan<T extends number>(
  max: number,
  T: t.Type<T, number, unknown>
): t.Type<T, number, unknown> {
  return new t.Type(
    `${T.name}LowerThan${max}`,
    T.is,
    (u, c) =>
      pipe(
        T.decode(u),
        either.chain(n => (n < max ? t.success(n as T) : t.failure(u, c)))
      ),
    identity
  )
}

function NumberFromStringLowerThan<T extends number>(
  max: number,
  T: t.Type<T, string, unknown>
): t.Type<T, string, unknown> {
  return new t.Type(
    `${T.name}LowerThan${max}`,
    T.is,
    (u, c) =>
      pipe(
        T.decode(u),
        either.chain(n => (n < max ? t.success(n as T) : t.failure(u, c)))
      ),
    n => n.toString(10)
  )
}

export const Month = t.intersection(
  [NumberHigherThan(-1, t.Int), NumberLowerThan(12, t.Int)],
  'Month'
)
export type Month = t.TypeOf<typeof Month>

export const MonthFromString = t.intersection(
  [
    NumberFromStringHigherThan(-1, IntFromString),
    NumberFromStringLowerThan(12, IntFromString)
  ],
  'MonthFromString'
)
export type MonthFromString = t.TypeOf<typeof MonthFromString>

export const Day = t.intersection(
  [NumberHigherThan(0, t.Int), NumberLowerThan(32, t.Int)],
  'Day'
)
export type Day = t.TypeOf<typeof Day>

export const DayFromString = t.intersection(
  [
    NumberFromStringHigherThan(0, IntFromString),
    NumberFromStringLowerThan(32, IntFromString)
  ],
  'DayFromString'
)
export type DayFromString = t.TypeOf<typeof DayFromString>

export const Hour = t.intersection(
  [NumberHigherThan(-1, t.Int), NumberLowerThan(24, t.Int)],
  'Hour'
)
export type Hour = t.TypeOf<typeof Hour>

export const HourFromString = t.intersection(
  [
    NumberFromStringHigherThan(-1, IntFromString),
    NumberFromStringLowerThan(24, IntFromString)
  ],
  'HourFromString'
)
export type HourFromString = t.TypeOf<typeof HourFromString>

export const Minute = t.intersection(
  [NumberHigherThan(-1, t.Int), NumberLowerThan(60, t.Int)],
  'Minute'
)
export type Minute = t.TypeOf<typeof Minute>

export const MinuteFromString = t.intersection(
  [
    NumberFromStringHigherThan(-1, IntFromString),
    NumberFromStringLowerThan(60, IntFromString)
  ],
  'MinuteFromString'
)
export type MinuteFromString = t.TypeOf<typeof MinuteFromString>

export const IdInput = t.type(
  {
    id: PositiveInteger
  },
  'IdInput'
)
