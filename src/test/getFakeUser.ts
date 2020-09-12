import { UserFromDatabase } from '../user/interface'
import faker from 'faker'

type AllowedUser = Omit<UserFromDatabase, 'id' | 'created_at' | 'updated_at'>

export function getFakeUser(data: Partial<AllowedUser> = {}): AllowedUser {
  const firstName = faker.name.firstName()
  const lastName = faker.name.lastName()

  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email(firstName, lastName),
    password: faker.internet.password(),
    ...data
  }
}
