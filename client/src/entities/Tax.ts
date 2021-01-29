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
