import { eq } from 'fp-ts'
import { Eq } from 'fp-ts/Eq'
import * as t from 'io-ts'
import { LocalizedString, Percentage, PositiveInteger } from '../globalDomain'

export const Tax = t.type(
  {
    id: PositiveInteger,
    label: LocalizedString,
    value: Percentage
  },
  'Tax'
)
export type Tax = t.TypeOf<typeof Tax>

export const TaxCreationInput = t.type(
  {
    label: LocalizedString,
    value: Percentage
  },
  'TaxCreationInput'
)
export type TaxCreationInput = t.TypeOf<typeof TaxCreationInput>

export const eqTax: Eq<Tax> = eq.fromEquals((t1, t2) => t1.id === t2.id)
