import faker from 'faker'
import { Project } from '../project/Project'
import { toSQLDate } from '../misc/dbUtils'

export function getFakeProject(data: Partial<Project> = {}): Partial<Project> {
  return {
    name: faker.commerce.productName(),
    description: faker.lorem.sentence(),
    cashed_at: Math.random() < 0.5 ? null : toSQLDate(faker.date.past(1)),
    ...data
  }
}
