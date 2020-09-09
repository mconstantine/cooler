import faker from 'faker'
import { Task } from '../task/interface'
import { toSQLDate } from '../misc/dbUtils'

export function getFakeTask(data: Partial<Task> = {}): Partial<Task> {
  return {
    name: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    expectedWorkingHours: 1 + faker.random.number(99),
    hourlyCost: 10 + Math.floor(Math.random() * 10 * 2) / 2,
    start_time: toSQLDate(
      Math.random() < 0.5 ? faker.date.future(-1) : faker.date.future(1)
    ),
    ...data
  }
}
