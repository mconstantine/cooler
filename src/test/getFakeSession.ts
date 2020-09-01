import faker from 'faker'
import { Session } from '../session/Session'
import { toSQLDate, fromSQLDate } from '../misc/dbUtils'

export function getFakeSession(data?: Partial<Session>): Partial<Session> {
  const startTime = data?.start_time ? fromSQLDate(data.start_time) : faker.date.recent(10)
  const endTime = new Date(
    startTime.getTime() + 900000 + Math.round(Math.random() * 28800000 - 900000)
  )

  return {
    start_time: toSQLDate(startTime),
    end_time: toSQLDate(endTime),
    ...data
  }
}
