import { LocalizedString } from './../globalDomain'
import * as t from 'io-ts'
import { DateFromISOString, optionFromNullable } from 'io-ts-types'
import { ObjectId, PositiveInteger } from '../globalDomain'
import { pipe } from 'fp-ts/function'
import { option } from 'fp-ts'
import { formatDuration } from '../a18n'

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
    task: ObjectId,
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

export function formatSessionDuration(session: Session): LocalizedString {
  const endTime: number = pipe(
    session.endTime,
    option.map(_ => _.getTime()),
    option.getOrElse(() => Date.now())
  )

  return formatDuration(endTime - session.startTime.getTime(), true)
}
