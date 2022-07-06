import { eq } from 'fp-ts'
import { Eq } from 'fp-ts/Eq'
import * as t from 'io-ts'
import { LocalizedString, ObjectId, Percentage } from '../globalDomain'

export const Tax = t.type(
  {
    _id: ObjectId,
    label: LocalizedString,
    value: Percentage
  },
  'Tax'
)
export type Tax = t.TypeOf<typeof Tax>

const TaxInput = {
  label: LocalizedString,
  value: Percentage
}

export const TaxCreationInput = t.type(TaxInput, 'TaxCreationInput')
export type TaxCreationInput = t.TypeOf<typeof TaxCreationInput>

export const TaxUpdateInput = t.partial(TaxInput, 'TaxUpdateInput')
export type TaxUpdateInput = t.TypeOf<typeof TaxUpdateInput>

export const eqTax: Eq<Tax> = eq.fromEquals((t1, t2) => t1._id === t2._id)
