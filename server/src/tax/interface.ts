import * as t from 'io-ts'
import { NonEmptyString } from 'io-ts-types'
import { Percentage, PositiveInteger } from '../misc/Types'

export const Tax = t.type(
  {
    id: PositiveInteger,
    label: NonEmptyString,
    value: Percentage,
    user: PositiveInteger
  },
  'Tax'
)
export type Tax = t.TypeOf<typeof Tax>

export const TaxCreationInput = t.type(
  {
    label: NonEmptyString,
    value: Percentage
  },
  'TaxCreationInput'
)
export type TaxCreationInput = t.TypeOf<typeof TaxCreationInput>

export const DatabaseTaxCreationInput = t.type(
  {
    label: NonEmptyString,
    value: Percentage,
    user: PositiveInteger
  },
  'DatabaseTaxCreationInput'
)
export type DatabaseTaxCreationInput = t.TypeOf<typeof DatabaseTaxCreationInput>

export const TaxUpdateInput = t.partial(
  {
    label: NonEmptyString,
    value: Percentage,
    user: PositiveInteger
  },
  'TaxUpdateInput'
)
export type TaxUpdateInput = t.TypeOf<typeof TaxUpdateInput>
