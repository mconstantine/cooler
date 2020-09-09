import faker from 'faker'
import { Project } from '../project/interface'
import { toSQLDate } from '../misc/dbUtils'

export function getFakeProject(data: Partial<Project> = {}): Partial<Project> {
  const isCashed =
    data.cashed_at !== undefined ? !!data.cashed_at : Math.random() < 0.5

  return {
    name: faker.commerce.productName(),
    description: faker.lorem.sentence(),
    cashed_at: isCashed ? toSQLDate(faker.date.past(1)) : null,
    cashed_balance: isCashed ? 1 : null,
    ...data
  }
}
