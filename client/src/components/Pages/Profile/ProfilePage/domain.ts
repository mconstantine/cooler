import { gql } from '@apollo/client'
import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import {
  EmailString,
  LocalizedString,
  Percentage,
  PositiveInteger
} from '../../../../globalDomain'
import { Connection } from '../../../../misc/graphql'

const Tax = t.type({
  id: PositiveInteger,
  label: LocalizedString,
  value: Percentage
})

export const ProfileQueryOutput = t.type(
  {
    me: t.type({
      id: PositiveInteger,
      name: LocalizedString,
      email: EmailString,
      created_at: DateFromISOString,
      updated_at: DateFromISOString,
      taxes: Connection(Tax)
    })
  },
  'ProfileQueryOutput'
)

export const profileQuery = gql`
  query me {
    me {
      id
      name
      email
      created_at
      updated_at
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
`

const UserUpdateInput = t.type(
  {
    name: LocalizedString,
    email: EmailString,
    password: optionFromNullable(NonEmptyString)
  },
  'UserUpdate'
)

export const UpdateProfileMutationInput = t.type(
  {
    user: UserUpdateInput
  },
  'UpdateProfileInput'
)

export const UpdateProfileMutationOutput = t.type(
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

export const updateProfileMutation = gql`
  mutation updateProfile($user: UserUpdateInput!) {
    updateMe(user: $user) {
      id
      name
      email
      updated_at
    }
  }
`

export const deleteProfileMutation = gql`
  mutation deleteMe {
    deleteMe {
      id
    }
  }
`
