import * as t from 'io-ts'
import { NonNegativeInteger, NonNegativeIntegerFromString } from './Types'

export const ConnectionQueryArgs = t.partial(
  {
    first: NonNegativeIntegerFromString,
    last: NonNegativeIntegerFromString,
    before: NonNegativeInteger,
    after: NonNegativeInteger
  },
  'ConnectionQueryArgs'
)
export type ConnectionQueryArgs = t.TypeOf<typeof ConnectionQueryArgs>
