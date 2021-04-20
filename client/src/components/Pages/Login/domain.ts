import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { EmailString } from '../../../globalDomain'

import gql from 'graphql-tag'
import { makeMutation } from '../../../misc/graphql'

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

export const loginMutation = makeMutation({
  query: gql`
    mutation loginUser($email: String!, $password: String!) {
      loginUser(user: { email: $email, password: $password }) {
        accessToken
        refreshToken
        expiration
      }
    }
  `,
  inputCodec: LoginMutationInput,
  outputCodec: LoginMutationOutput
})
