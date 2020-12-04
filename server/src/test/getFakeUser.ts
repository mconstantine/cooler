import { UserCreationInput } from '../user/interface'
import faker from 'faker'
import { NonEmptyString } from 'io-ts-types'
import { EmailString } from '../misc/Types'

export function getFakeUser(
  data: Partial<UserCreationInput> = {}
): UserCreationInput {
  const firstName = faker.name.firstName()
  const lastName = faker.name.lastName()

  return {
    name: `${firstName} ${lastName}` as NonEmptyString,
    email: faker.internet.email(firstName, lastName) as EmailString,
    password: faker.internet.password() as NonEmptyString,
    ...data
  }
}
