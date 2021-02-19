import { gql } from '@apollo/client'
import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { createMutation } from '../../../effects/useMutation'
import { EmailString } from '../../../globalDomain'

const LoginMutationInput = t.type(
  {
    email: EmailString,
    password: NonEmptyString
  },
  'LoginMutationInput'
)

const LoginMutationOutput = t.type(
  {
    loginUser: t.type({
      accessToken: NonEmptyString,
      refreshToken: NonEmptyString,
      expiration: DateFromISOString
    })
  },
  'LoginMutationOutput'
)

export const loginMutation = createMutation(
  gql`
    mutation login($email: String!, $password: String!) {
      loginUser(user: { email: $email, password: $password }) {
        accessToken
        refreshToken
        expiration
      }
    }
  `,
  LoginMutationInput,
  LoginMutationOutput
)
