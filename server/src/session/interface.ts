import * as t from 'io-ts'
import { DateFromISOString, optionFromNullable } from 'io-ts-types'
import { DateFromSQLDate, optionFromNull, PositiveInteger } from '../misc/Types'

export const Session = t.type(
  {
    id: PositiveInteger,
    task: PositiveInteger,
    start_time: DateFromISOString,
    end_time: optionFromNullable(DateFromISOString)
  },
  'Session'
)
export type Session = t.TypeOf<typeof Session>

export const DatabaseSession = t.type(
  {
    id: PositiveInteger,
    task: PositiveInteger,
    start_time: DateFromSQLDate,
    end_time: optionFromNullable(DateFromSQLDate),
    user: PositiveInteger
  },
  'DatabaseSession'
)
export type DatabaseSession = t.TypeOf<typeof DatabaseSession>

export const SessionCreationInput = t.type(
  {
    task: PositiveInteger,
    start_time: DateFromSQLDate,
    end_time: optionFromNullable(DateFromSQLDate)
  },
  'SessionCreationInput'
)
export type SessionCreationInput = t.TypeOf<typeof SessionCreationInput>

export const SessionUpdateInput = t.partial(
  {
    task: PositiveInteger,
    start_time: DateFromSQLDate,
    end_time: optionFromNull(DateFromSQLDate)
  },
  'SessionUpdateInput'
)
export type SessionUpdateInput = t.TypeOf<typeof SessionUpdateInput>

export const TimesheetCreationInput = t.type(
  {
    since: DateFromISOString,
    to: DateFromISOString,
    project: PositiveInteger
  },
  'TimesheetCreationInput'
)
export type TimesheetCreationInput = t.TypeOf<typeof TimesheetCreationInput>
