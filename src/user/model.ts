import {
  User,
  TokenType,
  Token,
  AccessTokenResponse,
  Context,
  UserFromDatabase
} from './interface'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { ApolloError } from 'apollo-server-express'
import { insert, update, remove, fromSQLDate, toSQLDate } from '../misc/dbUtils'
import { hashSync, compareSync } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'
import { validate as isEmail } from 'isemail'
import { isUserContext } from '../misc/ensureUser'

export async function createUser(
  { name, email, password }: Pick<User, 'name' | 'email' | 'password'>,
  context: Context
): Promise<AccessTokenResponse> {
  const db = await getDatabase()

  if (!isUserContext(context)) {
    const { count } = (await db.get(
      SQL`SELECT COUNT(id) as count FROM user`
    )) as { count: number }

    if (count) {
      throw new ApolloError('Unauthorized', 'COOLER_403')
    }
  }

  if (!isEmail(email)) {
    throw new ApolloError('Invalid e-mail format', 'COOLER_400')
  }

  const duplicate = await db.get<UserFromDatabase>(
    SQL`SELECT id FROM user WHERE email = ${email}`
  )

  if (duplicate) {
    throw new ApolloError('Duplicate user', 'COOLER_409')
  }

  const { lastID } = await insert('user', {
    name,
    email,
    password: hashSync(password, 10)
  })

  return generateTokens(lastID!)
}

export async function loginUser({
  email,
  password
}: Pick<User, 'email' | 'password'>): Promise<AccessTokenResponse> {
  const db = await getDatabase()
  const user = await db.get<UserFromDatabase>(
    SQL`SELECT * FROM user WHERE email = ${email}`
  )

  if (!user) {
    throw new ApolloError('User not found', 'COOLER_404')
  }

  if (!compareSync(password, user.password)) {
    throw new ApolloError('Wrong password', 'COOLER_400')
  }

  return generateTokens(user.id)
}

export async function refreshToken({
  refreshToken
}: {
  refreshToken: string
}): Promise<AccessTokenResponse> {
  const token = verify(refreshToken, process.env.SECRET!, {
    ignoreExpiration: true
  }) as Token

  if (token.type !== TokenType.REFRESH || !token.id) {
    throw new ApolloError('Invalid token', 'COOLER_400')
  }

  const db = await getDatabase()
  const user = await db.get<Pick<UserFromDatabase, 'id'>>(
    SQL`SELECT id FROM user WHERE id = ${token.id}`
  )

  if (!user) {
    throw new ApolloError('Invalid token', 'COOLER_400')
  }

  return generateTokens(user.id, refreshToken)
}

export async function updateUser(
  id: number,
  user: Partial<Pick<User, 'name' | 'email' | 'password'>>
): Promise<User | null> {
  const { name, email, password } = user
  const db = await getDatabase()

  if (email) {
    if (!isEmail(email)) {
      throw new ApolloError('Invalid e-mail format', 'COOLER_400')
    }

    const duplicate = await db.get<UserFromDatabase>(SQL`
      SELECT id FROM user WHERE email = ${email} AND id != ${id}
    `)

    if (duplicate) {
      throw new ApolloError('Duplicate user', 'COOLER_409')
    }
  }

  const args = Object.entries({
    name,
    email,
    password: password ? hashSync(password, 10) : undefined
  })
    .filter(([, value]) => value !== undefined)
    .reduce((res, [key, value]) => ({ ...res, [key]: value }), {})

  await update('user', { ...args, id })

  const updatedUser = await db.get<UserFromDatabase>(
    SQL`SELECT * FROM user WHERE id = ${id}`
  )

  if (!updatedUser) {
    return null
  }

  return fromDatabase(updatedUser)
}

export async function deleteUser(id: number): Promise<User | null> {
  const db = await getDatabase()
  const user = await db.get<UserFromDatabase>(
    SQL`SELECT * FROM user WHERE id = ${id}`
  )

  if (!user) {
    return null
  }

  await remove('user', { id })

  return fromDatabase(user)
}

export function getUserFromContext<C extends Context>(context: C): User | null {
  if (!isUserContext(context)) {
    return null
  }

  return context.user
}

export function toDatabase(user: User): UserFromDatabase {
  return {
    ...user,
    created_at: toSQLDate(user.created_at),
    updated_at: toSQLDate(user.updated_at)
  }
}

export function fromDatabase(user: UserFromDatabase): User {
  return {
    ...user,
    created_at: fromSQLDate(user.created_at),
    updated_at: fromSQLDate(user.updated_at)
  }
}

function generateTokens(
  userId: number,
  oldRefreshToken?: string
): AccessTokenResponse {
  const expiration = new Date(Date.now() + 86400000)

  const accessToken = sign(
    {
      type: TokenType.ACCESS,
      id: userId
    } as Token,
    process.env.SECRET!,
    {
      expiresIn: 86400
    }
  )

  const refreshToken =
    oldRefreshToken ||
    sign(
      {
        type: TokenType.REFRESH,
        id: userId
      } as Token,
      process.env.SECRET!
    )

  return {
    accessToken,
    refreshToken,
    expiration
  }
}
