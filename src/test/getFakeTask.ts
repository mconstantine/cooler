import faker from 'faker'
import { ID } from '../misc/Types'
import { Task } from '../task/interface'

type AllowedTask = Omit<Task, 'id' | 'created_at' | 'updated_at'>

export function getFakeTask(
  project: ID,
  data: Partial<AllowedTask> = {}
): AllowedTask {
  return {
    name: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    expectedWorkingHours: 1 + faker.random.number(99),
    hourlyCost: 10 + Math.floor(Math.random() * 10 * 2) / 2,
    start_time:
      Math.random() < 0.5 ? faker.date.future(-1) : faker.date.future(1),
    project,
    ...data
  }
}
