import { SQLDate, ID } from '../misc/Types'

export interface User {
  readonly id: ID
  name: string
  email: string
  password: string
  readonly created_at: Date
  readonly updated_at: Date
}

export interface UserFromDatabase {
  readonly id: ID
  name: string
  email: string
  password: string
  readonly created_at: SQLDate
  readonly updated_at: SQLDate
}

export enum TokenType {
  ACCESS,
  REFRESH
}

export interface Token {
  type: TokenType
  id: ID
}

export type Context =
  | {}
  | {
      user: User
    }

export interface UserContext {
  user: User
}

export interface AccessTokenResponse {
  accessToken: string
  refreshToken: string
  expiration: Date
}

export type UserCreationInput = Pick<
  UserFromDatabase,
  'name' | 'email' | 'password'
>

export type UserLoginInput = Pick<UserFromDatabase, 'email' | 'password'>

export type RefreshTokenInput = {
  refreshToken: string
}

export type UserUpdateInput = Partial<
  Pick<UserFromDatabase, 'name' | 'email' | 'password'>
>
