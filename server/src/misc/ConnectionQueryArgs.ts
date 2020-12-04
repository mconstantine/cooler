import * as t from 'io-ts'
import { NonEmptyString } from 'io-ts-types'
import { NonNegativeInteger } from './Types'

export const ConnectionQueryArgs = t.partial(
  {
    first: NonNegativeInteger,
    last: NonNegativeInteger,
    before: NonEmptyString,
    after: NonEmptyString,
    orderBy: NonEmptyString
  },
  'ConnectionQueryArgs'
)
export type ConnectionQueryArgs = t.TypeOf<typeof ConnectionQueryArgs>
