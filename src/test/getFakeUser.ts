import { User } from '../user/User'
import faker from 'faker'

export function getFakeUser(data?: Partial<User>): Partial<User> {
  const firstName = faker.name.firstName()
  const lastName = faker.name.lastName()

  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email(firstName, lastName),
    password: faker.internet.password(),
    ...data
  }
}
