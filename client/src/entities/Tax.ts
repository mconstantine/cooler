import * as t from 'io-ts'
import { LocalizedString, Percentage } from '../globalDomain'

export const Tax = t.type(
  {
    label: LocalizedString,
    value: Percentage
  },
  'Tax'
)
export type Tax = t.TypeOf<typeof Tax>
