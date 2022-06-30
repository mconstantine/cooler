import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { makePostRequest } from '../../effects/api/useApi'
import { EmailString } from '../../globalDomain'

const LoginInput = t.type(
  {
    email: EmailString,
    password: NonEmptyString
  },
  'LoginInput'
)

const LoginOutput = t.type(
  {
    accessToken: NonEmptyString,
    refreshToken: NonEmptyString,
    expiration: DateFromISOString
  },
  'LoginOutput'
)

export const loginRequest = makePostRequest({
  url: '/users/login',
  inputCodec: LoginInput,
  outputCodec: LoginOutput
})
