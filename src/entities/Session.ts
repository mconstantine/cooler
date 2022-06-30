import * as t from 'io-ts'
import { DateFromISOString, optionFromNullable } from 'io-ts-types'
import { LocalizedString, PositiveInteger } from '../globalDomain'

const Task = t.type(
  {
    id: PositiveInteger,
    name: LocalizedString
  },
  'Task'
)

export const Session = t.type(
  {
    id: PositiveInteger,
    task: Task,
    start_time: DateFromISOString,
    end_time: optionFromNullable(DateFromISOString)
  },
  'Session'
)
export type Session = t.TypeOf<typeof Session>

export const SessionCreationInput = t.type(
  {
    task: PositiveInteger,
    start_time: DateFromISOString,
    end_time: optionFromNullable(DateFromISOString)
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
