import { gql } from '@apollo/client'
import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { EmailString } from '../../../globalDomain'

export const LoginMutationInput = t.type(
  {
    email: EmailString,
    password: NonEmptyString
  },
  'LoginMutationInput'
)

export const LoginMutationOutput = t.type(
  {
    loginUser: t.type({
      accessToken: NonEmptyString,
      refreshToken: NonEmptyString,
      expiration: DateFromISOString
    })
  },
  'LoginMutationOutput'
)

export const loginMutation = gql`
  mutation login($email: String!, $password: String!) {
    loginUser(user: { email: $email, password: $password }) {
      accessToken
      refreshToken
      expiration
    }
  }
`
