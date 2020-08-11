import { User, TokenType, Token, UserContext } from './User'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { ApolloError } from 'apollo-server'
import { insert, update, remove, toSQLDate } from '../misc/dbUtils'
import { hashSync, compareSync } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'
import { validate as isEmail } from 'isemail'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'

export async function createUser(
  { name, email, password }: Pick<User, 'name' | 'email' | 'password'>,
  context: UserContext
) {
  const db = await getDatabase()

  if (!context.user) {
    const { count } = await db.get(SQL`SELECT COUNT(id) as count FROM user`) as { count: number }

    if (count) {
      throw new ApolloError('Unauthorized', 'COOLER_403')
    }
  }

  if (!isEmail(email)) {
    throw new ApolloError('Invalid e-mail format', 'COOLER_400')
  }

  const duplicate = await db.get<User>(SQL`SELECT id FROM user WHERE email = ${email}`)

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

export async function loginUser({ email, password }: { email: string, password: string }) {
  const db = await getDatabase()
  const user = await db.get<User>(SQL`SELECT * FROM user WHERE email = ${email}`)

  if (!user) {
    throw new ApolloError('User not found', 'COOLER_404')
  }

  if (!compareSync(password, user.password)) {
    throw new ApolloError('Wrong password', 'COOLER_400')
  }

  return generateTokens(user.id)
}

export async function refreshToken({ refreshToken }: { refreshToken: string }) {
  const token = verify(refreshToken, process.env.SECRET!, {
    ignoreExpiration: true
  }) as Token

  if (token.type !== TokenType.REFRESH || !token.id) {
    throw new ApolloError('Invalid token', 'COOLER_400')
  }

  const db = await getDatabase()
  const user = await db.get<Pick<User, 'id'>>(SQL`SELECT id FROM user WHERE id = ${token.id}`)

  if (!user) {
    throw new ApolloError('Invalid token', 'COOLER_400')
  }

  return generateTokens(user.id, refreshToken)
}

export async function listUsers(args: ConnectionQueryArgs & { name?: string, email?: string }) {
  const where = SQL`WHERE 1`

  args.name && where.append(SQL` AND name LIKE ${`%${args.name}%`}`)
  args.email && where.append(SQL` AND email LIKE ${`%${args.email}%`}`)

  return queryToConnection(args, ['*'], 'user', where)
}

export async function updateUser(id: number, user: Partial<User>) {
  const { name, email, password } = user
  const db = await getDatabase()

  if (email) {
    if (!isEmail(email)) {
      throw new ApolloError('Invalid e-mail format', 'COOLER_400')
    }

    const duplicate = await db.get<User>(SQL`
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
  }).filter(
    ([, value]) => !!value
  ).reduce(
    (res, [key, value]) => ({ ...res, [key]: value }), {}
  )

  await update('user', { ...args, id })

  return await db.get<User>(SQL`SELECT * FROM user WHERE id = ${id}`)
}

export async function deleteUser(id: number) {
  const db = await getDatabase()
  const user = await db.get<User>(SQL`SELECT * FROM user WHERE id = ${id}`)

  if (!user) {
    return null
  }

  await remove('user', { id })

  return user
}

function generateTokens(userId: number, oldRefreshToken?: string) {
  const expiration = toSQLDate(new Date(Date.now() + 86400000))

  const accessToken = sign({
    type: TokenType.ACCESS,
    id: userId
  } as Token, process.env.SECRET!, {
    expiresIn: 86400
  })

  const refreshToken = oldRefreshToken || sign({
    type: TokenType.REFRESH,
    id: userId
  } as Token, process.env.SECRET!)

  return {
    accessToken,
    refreshToken,
    expiration
  }
}
