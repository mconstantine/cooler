import * as t from 'io-ts'
import {
  date,
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import { makeCollection, ObjectIdFromString, WithIdC } from '../misc/Entity'
import { EmailString } from '../misc/Types'

const userProps = {
  name: NonEmptyString,
  email: EmailString,
  password: NonEmptyString,
  createdAt: DateFromISOString,
  updatedAt: DateFromISOString
}

export const User = t.type(userProps, 'User')
export type User = t.TypeOf<typeof User>

export const DatabaseUser = t.type(
  {
    name: NonEmptyString,
    email: EmailString,
    password: NonEmptyString,
    createdAt: date,
    updatedAt: date
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
    _id: ObjectIdFromString
  },
  'Token'
)
export type Token = t.TypeOf<typeof Token>

export const UserContext = t.type(
  {
    user: WithIdC(User)
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

export const userCollection = makeCollection('users', userProps, DatabaseUser)
