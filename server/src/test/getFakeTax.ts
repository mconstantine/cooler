import faker from 'faker'
import {
  Percentage,
  PositiveInteger,
  unsafeNonEmptyString
} from '../misc/Types'
import { TaxCreationInput } from '../tax/interface'

export function getFakeTax(
  user: PositiveInteger,
  data: Partial<TaxCreationInput> = {}
): TaxCreationInput & { user: PositiveInteger } {
  return {
    label: unsafeNonEmptyString(faker.lorem.word()),
    value: (Math.floor(Math.random() * 10000) / 10000) as Percentage,
    user,
    ...data
  }
}
