import { SQLDateString } from '../misc/Types'

export interface User {
  id: number
  name: string
  email: string
  password: string
  created_at: SQLDateString
  updated_at: SQLDateString
}

export enum TokenType {
  ACCESS,
  REFRESH
}

export interface Token {
  type: TokenType
  id: number
}

export interface UserContext {
  user: User | null
}

export interface AccessTokenResponse {
  accessToken: string
  refreshToken: string
  expiration: SQLDateString
}
