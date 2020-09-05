import faker from 'faker'
import { Tax } from '../tax/Tax'

export function getFakeTax(data: Partial<Tax> = {}): Partial<Tax> {
  return {
    label: faker.lorem.word(),
    value: Math.floor(Math.random() * 10000) / 10000,
    ...data
  }
}
