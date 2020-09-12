import faker from 'faker'
import { ProjectFromDatabase } from '../project/interface'
import { toSQLDate } from '../misc/dbUtils'
import { ID } from '../misc/Types'

type AllowedProject = Omit<
  ProjectFromDatabase,
  'id' | 'created_at' | 'updated_at'
>

export function getFakeProject(
  client: ID,
  data: Partial<AllowedProject> = {}
): AllowedProject {
  const isCashed =
    data.cashed_at !== undefined ? !!data.cashed_at : Math.random() < 0.5

  return {
    name: faker.commerce.productName(),
    description: faker.lorem.sentence(),
    cashed_at: isCashed ? toSQLDate(faker.date.past(1)) : null,
    cashed_balance: isCashed ? 1 : null,
    client,
    ...data
  }
}
