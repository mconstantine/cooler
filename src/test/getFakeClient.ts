import faker from 'faker'
import {
  ClientType,
  Province,
  Country,
  ClientFromDatabase
} from '../client/interface'
import { foldClientType } from '../client/model'
import { ID } from '../misc/Types'

type AllowedClient = Omit<
  ClientFromDatabase,
  'id' | 'created_at' | 'updated_at'
>

export function getFakeClient(
  user: ID,
  { type, ...data }: Partial<AllowedClient> = {}
): AllowedClient {
  type = type || faker.random.arrayElement(Object.values(ClientType))

  const country_code = faker.address.countryCode() as keyof typeof Country

  const commonData = {
    type,
    user,
    address_country: country_code,
    address_province:
      country_code !== 'IT'
        ? 'EE'
        : (faker.random.arrayElement(
            Object.keys(Province)
          ) as keyof typeof Province),
    address_city: faker.address.city(),
    address_zip: faker.address.zipCode(),
    address_street: faker.address.streetName(),
    address_street_number: (1 + Math.round(Math.random() * 199)).toString(10),
    address_email: faker.internet.email()
  }

  return foldClientType(commonData, {
    whenPrivate: client => ({
      ...client,
      ...data,
      fiscal_code: generateFiscalCode(),
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      country_code: null,
      vat_number: null,
      business_name: null
    }),
    whenBusiness: client => ({
      ...client,
      ...data,
      fiscal_code: null,
      first_name: null,
      last_name: null,
      country_code: country_code,
      vat_number: faker.finance.mask(11),
      business_name: faker.company.companyName()
    })
  })
}

function generateFiscalCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '1234567890'
  const format = 'aaaaaaddaddaddda'

  return format
    .split('')
    .map(char => {
      const target = (char === 'a' ? letters : numbers).split('')
      return target[Math.round(Math.random() * (target.length - 1))]
    })
    .join('')
}
