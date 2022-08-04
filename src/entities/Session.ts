import { LocalizedString } from './../globalDomain'
import * as t from 'io-ts'
import { DateFromISOString, optionFromNullable } from 'io-ts-types'
import { ObjectId, PositiveInteger } from '../globalDomain'
import { pipe } from 'fp-ts/function'
import { option } from 'fp-ts'
import { formatDuration } from '../a18n'
import { Option } from 'fp-ts/Option'
import { ProjectLabel } from './Task'
import { ClientLabel } from './Project'

const TaskLabel = t.type(
  {
    _id: ObjectId,
    name: LocalizedString,
    startTime: DateFromISOString
  },
  'TaskLabel'
)

export const Session = t.type(
  {
    _id: ObjectId,
    startTime: DateFromISOString,
    endTime: optionFromNullable(DateFromISOString),
    task: TaskLabel,
    project: ProjectLabel,
    client: ClientLabel
  },
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

interface SessionForDuration {
  startTime: Date
  endTime: Option<Date>
}

export function formatSessionDuration(
  session: SessionForDuration
): LocalizedString {
  const endTime: number = pipe(
    session.endTime,
    option.map(_ => _.getTime()),
    option.getOrElse(() => Date.now())
  )

  return formatDuration(endTime - session.startTime.getTime(), true)
}
