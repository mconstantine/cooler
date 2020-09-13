import { ID, SQLDate } from '../misc/Types'

interface SessionCommonData {
  readonly id: ID
  task: ID
}

export interface Session extends SessionCommonData {
  start_time: Date
  end_time: Date | null
}

export interface SessionFromDatabase extends SessionCommonData {
  start_time: SQLDate
  end_time: SQLDate | null
}

export type SessionUpdateInput = Partial<
  Pick<SessionFromDatabase, 'start_time' | 'end_time' | 'task'>
>

export interface TimesheetCreationInput {
  since: SQLDate
  to: SQLDate
  project: ID
}
