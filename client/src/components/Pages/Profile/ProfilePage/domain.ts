import gql from 'graphql-tag'
import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import {
  EmailString,
  LocalizedString,
  NonNegativeNumber,
  Percentage,
  PositiveInteger
} from '../../../../globalDomain'
import { Connection, makeMutation, makeQuery } from '../../../../misc/graphql'

const Tax = t.type({
  id: PositiveInteger,
  label: LocalizedString,
  value: Percentage
})

const ProfileQueryInput = t.type(
  {
    since: DateFromISOString
  },
  'ProfileQueryInput'
)

const ProfileQueryOutput = t.type(
  {
    me: t.type({
      id: PositiveInteger,
      name: LocalizedString,
      email: EmailString,
      created_at: DateFromISOString,
      updated_at: DateFromISOString,
      expectedWorkingHours: NonNegativeNumber,
      actualWorkingHours: NonNegativeNumber,
      budget: NonNegativeNumber,
      balance: NonNegativeNumber,
      cashedBalance: NonNegativeNumber,
      taxes: Connection(Tax)
    })
  },
  'ProfileQueryOutput'
)

export const profileQuery = makeQuery({
  query: gql`
    query me($since: Date!) {
      me {
        id
        name
        email
        created_at
        updated_at
        expectedWorkingHours(since: $since)
        actualWorkingHours(since: $since)
        budget(since: $since)
        balance(since: $since)
        cashedBalance(since: $since)
        taxes {
          pageInfo {
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
          }
          totalCount
          edges {
            cursor
            node {
              id
              label
              value
            }
          }
        }
      }
    }
  `,
  inputCodec: ProfileQueryInput,
  outputCodec: ProfileQueryOutput
})

const UserUpdateInput = t.type(
  {
    name: LocalizedString,
    email: EmailString,
    password: optionFromNullable(NonEmptyString)
  },
  'UserUpdate'
)

const UpdateProfileMutationInput = t.type(
  {
    user: UserUpdateInput
  },
  'UpdateProfileInput'
)

const UpdateProfileMutationOutput = t.type(
  {
    updateMe: t.type({
      id: PositiveInteger,
      name: LocalizedString,
      email: EmailString,
      updated_at: DateFromISOString
    })
  },
  'UpdateProfileOutput'
)

export const updateProfileMutation = makeMutation({
  query: gql`
    mutation updateProfile($user: UserUpdateInput!) {
      updateMe(user: $user) {
        id
        name
        email
        updated_at
      }
    }
  `,
  inputCodec: UpdateProfileMutationInput,
  outputCodec: UpdateProfileMutationOutput
})

export const deleteProfileMutation = makeMutation({
  query: gql`
    mutation deleteMe {
      deleteMe {
        id
      }
    }
  `,
  inputCodec: t.void,
  outputCodec: t.unknown
})
