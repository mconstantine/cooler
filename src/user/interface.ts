import { SQLDate, ID } from '../misc/Types'

export interface User {
  id: ID
  name: string
  email: string
  password: string
  created_at: Date
  updated_at: Date
}

export interface UserFromDatabase {
  id: ID
  name: string
  email: string
  password: string
  created_at: SQLDate
  updated_at: SQLDate
}

export enum TokenType {
  ACCESS,
  REFRESH
}

export interface Token {
  type: TokenType
  id: number
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
