import { ID } from '../misc/Types'

export interface Tax {
  readonly id: ID
  label: string
  value: number
  user: ID
}

export type TaxCreationInput = Pick<Tax, 'label' | 'value'>
export type TaxUpdateInput = Partial<TaxCreationInput>
