import faker from 'faker'
import { option } from 'fp-ts'
import { PositiveInteger } from '../misc/Types'
import { SessionCreationInput } from '../session/interface'

export function getFakeSession(
  task: PositiveInteger,
  data?: Partial<SessionCreationInput>
): SessionCreationInput {
  const startTime =
    data?.start_time ??
    (() => {
      const date = faker.date.recent(10)
      date.setMilliseconds(0)
      return date
    })()

  const endTime = new Date(
    startTime.getTime() + 900000 + Math.round(Math.random() * 28800000 - 900000)
  )

  endTime.setMilliseconds(0)

  return {
    start_time: startTime,
    end_time: option.some(endTime),
    task,
    ...data
  }
}
