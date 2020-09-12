import faker from 'faker'
import { Session, SessionFromDatabase } from '../session/interface'
import { toSQLDate, fromSQLDate } from '../misc/dbUtils'
import { ID } from '../misc/Types'

type AllowedSession = Omit<Session, 'id'>
type AllowedSessionFromdatabase = Omit<SessionFromDatabase, 'id'>

export function getFakeSession(
  task: ID,
  data?: Partial<AllowedSession>
): AllowedSession {
  const startTime = data?.start_time ?? faker.date.recent(10)

  const endTime = new Date(
    startTime.getTime() + 900000 + Math.round(Math.random() * 28800000 - 900000)
  )

  return {
    start_time: startTime,
    end_time: endTime,
    task,
    ...data
  }
}

export function getFakeSessionFromDatabase(
  task: ID,
  data?: Partial<AllowedSessionFromdatabase>
): AllowedSessionFromdatabase {
  const startTime = data?.start_time
    ? fromSQLDate(data.start_time)
    : faker.date.recent(10)

  const endTime = new Date(
    startTime.getTime() + 900000 + Math.round(Math.random() * 28800000 - 900000)
  )

  return {
    start_time: toSQLDate(startTime),
    end_time: toSQLDate(endTime),
    task,
    ...data
  }
}
