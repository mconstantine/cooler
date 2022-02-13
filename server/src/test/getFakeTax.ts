import faker from 'faker'
import { NonEmptyString } from 'io-ts-types'
import { Percentage, PositiveInteger } from '../misc/Types'
import { TaxCreationInput } from '../tax/interface'

export function getFakeTax(
  user: PositiveInteger,
  data: Partial<TaxCreationInput> = {}
): TaxCreationInput & { user: PositiveInteger } {
  return {
    label: faker.lorem.word() as NonEmptyString,
    value: (Math.floor(Math.random() * 10000) / 10000) as Percentage,
    user,
    ...data
  }
}
