import * as t from 'io-ts'
import { DateFromISOString, optionFromNullable } from 'io-ts-types'
import { ObjectId, PositiveInteger } from '../globalDomain'

const SessionData = t.type(
  {
    _id: ObjectId,
    startTime: DateFromISOString,
    endTime: optionFromNullable(DateFromISOString)
  },
  'SessionData'
)

export const Session = t.intersection(
  [SessionData, t.type({ task: ObjectId })],
  'Session'
)
export type Session = t.TypeOf<typeof Session>

export const SessionCreationInput = t.type(
  {
    task: PositiveInteger,
    startTime: DateFromISOString,
    endTime: optionFromNullable(DateFromISOString)
  },
  'SessionCreationInput'
)
export type SessionCreationInput = t.TypeOf<typeof SessionCreationInput>

export const TimesheetCreationInput = t.type(
  {
    since: DateFromISOString,
    to: DateFromISOString,
    project: PositiveInteger
  },
  'TimesheetCreationInput'
)
export type TimesheetCreationInput = t.TypeOf<typeof TimesheetCreationInput>
