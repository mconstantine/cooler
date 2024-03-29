import * as t from 'io-ts'
import { DateFromISOString } from 'io-ts-types'
import { EmailString, LocalizedString } from '../globalDomain'

export const User = t.type(
  {
    name: LocalizedString,
    email: EmailString,
    createdAt: DateFromISOString,
    updatedAt: DateFromISOString
  },
  'User'
)
export type User = t.TypeOf<typeof User>
