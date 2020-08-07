import faker from 'faker'
import { Client } from '../client/Client'

export function getFakeClient(data?: Partial<Client>): Partial<Client> {
  return {
    name: faker.company.companyName(),
    ...data
  }
}
