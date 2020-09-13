import faker from 'faker'
import { toSQLDate } from '../misc/dbUtils'
import { ID } from '../misc/Types'
import { Task, TaskFromDatabase } from '../task/interface'

type TaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at'>

type TaskFromDatabaseInput = Omit<
  TaskFromDatabase,
  'id' | 'created_at' | 'updated_at'
>

export function getFakeTask(
  project: ID,
  data: Partial<TaskInput> = {}
): TaskInput {
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

export function getFakeTaskFromDatabase(
  project: ID,
  data: Partial<TaskFromDatabaseInput> = {}
): TaskFromDatabaseInput {
  return {
    name: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    expectedWorkingHours: 1 + faker.random.number(99),
    hourlyCost: 10 + Math.floor(Math.random() * 10 * 2) / 2,
    start_time: toSQLDate(
      Math.random() < 0.5 ? faker.date.future(-1) : faker.date.future(1)
    ),
    project,
    ...data
  }
}
