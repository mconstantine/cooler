import { UserCreationInput } from '../user/interface'
import faker from 'faker'
import { unsafeEmailString, unsafeNonEmptyString } from '../misc/Types'

export function getFakeUser(
  data: Partial<UserCreationInput> = {}
): UserCreationInput {
  const firstName = faker.name.firstName()
  const lastName = faker.name.lastName()

  return {
    name: unsafeNonEmptyString(`${firstName} ${lastName}`),
    email: unsafeEmailString(faker.internet.email(firstName, lastName)),
    password: unsafeNonEmptyString(faker.internet.password()),
    ...data
  }
}
