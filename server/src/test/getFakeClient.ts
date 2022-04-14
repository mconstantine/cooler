import faker from 'faker'
import { boolean, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { ObjectId } from 'mongodb'
import {
  Province,
  Country,
  ClientCreationInput,
  ClientType,
  PrivateClientCreationInput,
  BusinessClientCreationInput,
  ClientCreationCommonInput
} from '../client/interface'
import { EmailString, unsafeNonEmptyString } from '../misc/Types'

export function getFakeClient(
  userId: ObjectId,
  data?: Partial<PrivateClientCreationInput>
): PrivateClientCreationInput & { user: ObjectId }
export function getFakeClient(
  userId: ObjectId,
  data?: Partial<BusinessClientCreationInput>
): BusinessClientCreationInput & { user: ObjectId }
export function getFakeClient(
  userId: ObjectId,
  data: Partial<ClientCreationInput> = {}
): ClientCreationInput & { user: ObjectId } {
  const type = data.type || faker.random.arrayElement(Object.values(ClientType))
  const countryCode = faker.address.countryCode() as Country

  const commonData: ClientCreationCommonInput & { user: ObjectId } = {
    user: userId,
    addressCountry: countryCode,
    addressProvince:
      countryCode !== 'IT'
        ? 'EE'
        : (faker.random.arrayElement(Object.keys(Province)) as Province),
    addressCity: unsafeNonEmptyString(faker.address.city()),
    addressZip: unsafeNonEmptyString(faker.address.zipCode()),
    addressStreet: unsafeNonEmptyString(faker.address.streetName()),
    addressStreetNumber: option.some(
      unsafeNonEmptyString((1 + Math.round(Math.random() * 199)).toString(10))
    ),
    addressEmail: faker.internet.email() as EmailString
  }

  return pipe(
    type === 'BUSINESS',
    boolean.fold(
      () => ({
        ...commonData,
        ...data,
        type: 'PRIVATE',
        fiscalCode: generateFiscalCode(),
        firstName: unsafeNonEmptyString(faker.name.firstName()),
        lastName: unsafeNonEmptyString(faker.name.lastName())
      }),
      () => ({
        ...commonData,
        // @ts-ignore
        type: 'BUSINESS',
        countryCode: countryCode,
        vatNumber: unsafeNonEmptyString(faker.finance.mask(11)),
        businessName: unsafeNonEmptyString(faker.company.companyName())
      })
    )
  )
}

function generateFiscalCode(): NonEmptyString {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '1234567890'
  const format = 'aaaaaaddaddaddda'

  return unsafeNonEmptyString(
    format
      .split('')
      .map(char => {
        const target = (char === 'a' ? letters : numbers).split('')
        return target[Math.round(Math.random() * (target.length - 1))]
      })
      .join('')
  )
}
