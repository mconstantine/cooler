import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import { DateFromSQLDate, EmailString, PositiveInteger } from '../misc/Types'

export const User = t.type(
  {
    id: PositiveInteger,
    name: NonEmptyString,
    email: EmailString,
    password: NonEmptyString,
    created_at: DateFromISOString,
    updated_at: DateFromISOString
  },
  'User'
)
export type User = t.TypeOf<typeof User>

export const DatabaseUser = t.type(
  {
    id: PositiveInteger,
    name: NonEmptyString,
    email: EmailString,
    password: NonEmptyString,
    created_at: DateFromSQLDate,
    updated_at: DateFromSQLDate
  },
  'DatabaseUser'
)
export type DatabaseUser = t.TypeOf<typeof DatabaseUser>

export const TokenType = t.keyof(
  {
    ACCESS: true,
    REFRESH: true
  },
  'TokenType'
)
export type TokenType = t.TypeOf<typeof TokenType>

export const Token = t.type(
  {
    type: TokenType,
    id: PositiveInteger
  },
  'Token'
)
export type Token = t.TypeOf<typeof Token>

export const UserContext = t.type(
  {
    user: User
  },
  'UserContext'
)
export type UserContext = t.TypeOf<typeof UserContext>

export const Context = t.union([t.type({}), UserContext], 'Context')
export type Context = t.TypeOf<typeof Context>

export const AccessTokenResponse = t.type(
  {
    accessToken: NonEmptyString,
    refreshToken: NonEmptyString,
    expiration: DateFromISOString
  },
  'AccessTokenResponse'
)
export type AccessTokenResponse = t.TypeOf<typeof AccessTokenResponse>

export const UserCreationInput = t.type(
  {
    name: NonEmptyString,
    email: EmailString,
    password: NonEmptyString
  },
  'UserCreationInput'
)
export type UserCreationInput = t.TypeOf<typeof UserCreationInput>

export const UserLoginInput = t.type(
  {
    email: EmailString,
    password: NonEmptyString
  },
  'UserLoginInput'
)
export type UserLoginInput = t.TypeOf<typeof UserLoginInput>

export const RefreshTokenInput = t.type(
  {
    refreshToken: NonEmptyString
  },
  'RefreshTokenInput'
)
export type RefreshTokenInput = t.TypeOf<typeof RefreshTokenInput>

export const UserUpdateInput = t.partial(
  {
    name: NonEmptyString,
    email: EmailString,
    password: optionFromNullable(NonEmptyString)
  },
  'UserUpdateInput'
)
export type UserUpdateInput = t.TypeOf<typeof UserUpdateInput>
