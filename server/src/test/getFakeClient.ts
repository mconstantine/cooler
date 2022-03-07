import faker from 'faker'
import { boolean, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import {
  Province,
  Country,
  ClientCreationInput,
  ClientType,
  PrivateClientCreationInput,
  BusinessClientCreationInput,
  ClientCreationCommonInput
} from '../client/interface'
import {
  EmailString,
  PositiveInteger,
  unsafeNonEmptyString
} from '../misc/Types'

export function getFakeClient(
  user: PositiveInteger,
  data?: Partial<PrivateClientCreationInput>
): PrivateClientCreationInput & { user: PositiveInteger }
export function getFakeClient(
  user: PositiveInteger,
  data?: Partial<BusinessClientCreationInput>
): BusinessClientCreationInput & { user: PositiveInteger }
export function getFakeClient(
  user: PositiveInteger,
  data: Partial<ClientCreationInput> = {}
): ClientCreationInput & { user: PositiveInteger } {
  const type = data.type || faker.random.arrayElement(Object.values(ClientType))
  const country_code = faker.address.countryCode() as Country

  const commonData: ClientCreationCommonInput & { user: PositiveInteger } = {
    user,
    address_country: country_code,
    address_province:
      country_code !== 'IT'
        ? 'EE'
        : (faker.random.arrayElement(Object.keys(Province)) as Province),
    address_city: unsafeNonEmptyString(faker.address.city()),
    address_zip: unsafeNonEmptyString(faker.address.zipCode()),
    address_street: unsafeNonEmptyString(faker.address.streetName()),
    address_street_number: option.some(
      unsafeNonEmptyString((1 + Math.round(Math.random() * 199)).toString(10))
    ),
    address_email: faker.internet.email() as EmailString
  }

  return pipe(
    type === 'BUSINESS',
    boolean.fold(
      () => ({
        ...commonData,
        ...data,
        type: 'PRIVATE',
        fiscal_code: generateFiscalCode(),
        first_name: unsafeNonEmptyString(faker.name.firstName()),
        last_name: unsafeNonEmptyString(faker.name.lastName())
      }),
      () => ({
        ...commonData,
        // @ts-ignore
        type: 'BUSINESS',
        country_code: country_code,
        vat_number: unsafeNonEmptyString(faker.finance.mask(11)),
        business_name: unsafeNonEmptyString(faker.company.companyName())
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
