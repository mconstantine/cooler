import faker from 'faker'
import { ID } from '../misc/Types'
import { Tax } from '../tax/interface'

type TaxInput = Omit<Tax, 'id'>

export function getFakeTax(user: ID, data: Partial<TaxInput> = {}): TaxInput {
  return {
    label: faker.lorem.word(),
    value: Math.floor(Math.random() * 10000) / 10000,
    user,
    ...data
  }
}
