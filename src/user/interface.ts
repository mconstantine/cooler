export interface User {
  id: number
  name: string
  email: string
  password: string
  created_at: string
  updated_at: string
}

export enum TokenType {
  ACCESS, REFRESH
}

export interface Token {
  type: TokenType,
  id: number
}

export interface UserContext {
  user: User | null
}
