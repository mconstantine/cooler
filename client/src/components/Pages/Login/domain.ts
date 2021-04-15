// import * as t from 'io-ts'
// import { DateFromISOString, NonEmptyString } from 'io-ts-types'
// import { EmailString } from '../../../globalDomain'

import gql from 'graphql-tag'

// const LoginMutationInput = t.type(
//   {
//     email: EmailString,
//     password: NonEmptyString
//   },
//   'LoginMutationInput'
// )

// const LoginMutationOutput = t.type(
//   {
//     loginUser: t.type({
//       accessToken: NonEmptyString,
//       refreshToken: NonEmptyString,
//       expiration: DateFromISOString
//     })
//   },
//   'LoginMutationOutput'
// )

export const loginMutation = gql`
  mutation login($email: String!, $password: String!) {
    loginUser(email: $email, password: $password) {
      accessToken
      refreshToken
      expiration
    }
  }
`
