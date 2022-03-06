import * as t from 'io-ts'
import { NonEmptyString } from 'io-ts-types'
import { NonNegativeIntegerFromString } from './Types'

export const ConnectionQueryArgs = t.partial(
  {
    first: NonNegativeIntegerFromString,
    last: NonNegativeIntegerFromString,
    before: NonEmptyString,
    after: NonEmptyString,
    orderBy: NonEmptyString
  },
  'ConnectionQueryArgs'
)
export type ConnectionQueryArgs = t.TypeOf<typeof ConnectionQueryArgs>
