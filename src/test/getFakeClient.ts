import faker from 'faker'
import { Client, ClientType, Province, Country } from '../client/interface'

export function getFakeClient(data: Partial<Client> = {}): Partial<Client> {
  const type: ClientType =
    data.type || faker.random.arrayElement(Object.values(ClientType))

  const country_code = faker.address.countryCode() as keyof typeof Country
  const commonData: Partial<Client> = {
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

  const typeData: Partial<Client> =
    type === ClientType.BUSINESS
      ? {
          country_code: country_code,
          vat_number: faker.finance.mask(11),
          business_name: faker.company.companyName()
        }
      : {
          fiscal_code: generateFiscalCode(),
          first_name: faker.name.firstName(),
          last_name: faker.name.lastName()
        }

  const res = {
    ...typeData,
    ...commonData,
    ...data,
    type
  }

  return res
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
