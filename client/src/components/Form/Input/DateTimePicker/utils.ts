import { either } from 'fp-ts'
import { Either } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { a18n } from '../../../../a18n'
import {
  Day,
  DayFromString,
  Hour,
  HourFromString,
  LocalizedString,
  PositiveInteger,
  PositiveIntegerFromString
} from '../../../../globalDomain'

export function validateYear(
  year: string
): Either<LocalizedString, PositiveInteger> {
  return pipe(
    year,
    PositiveIntegerFromString.decode,
    either.mapLeft(() => a18n`This is not a valid year`)
  )
}

export function validateDay(day: string): Either<LocalizedString, Day> {
  return pipe(
    day,
    DayFromString.decode,
    either.mapLeft(() => a18n`This is not a valid month`)
  )
}

export function validateHours(hours: string): Either<LocalizedString, Hour> {
  return pipe(
    hours,
    HourFromString.decode,
    either.mapLeft(() => a18n`This is not a valid value for hours`)
  )
}

export function leadZero(n: string): string {
  return /^[0-9]$/.test(n) ? `0${n}` : n
}
