import { SQLDate } from '../misc/Types'

export interface User {
  id: number
  name: string
  email: string
  password: string
  created_at: Date
  updated_at: Date
}

export interface UserFromDatabase {
  id: number
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
