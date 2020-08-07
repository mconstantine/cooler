import faker from 'faker'
import { Task } from '../task/Task'

export function getFakeTask(data?: Partial<Task>): Partial<Task> {
  return {
    description: faker.lorem.sentence(),
    expectedWorkingHours: 1 + faker.random.number(99),
    actualWorkingHours: 1 + faker.random.number(99),
    ...data
  }
}
