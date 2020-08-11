import faker from 'faker'
import { Task } from '../task/Task'

export function getFakeTask(data?: Partial<Task>): Partial<Task> {
  return {
    name: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    expectedWorkingHours: 1 + faker.random.number(99),
    actualWorkingHours: 1 + faker.random.number(99),
    ...data
  }
}
