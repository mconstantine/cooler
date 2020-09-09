import { Context, Token, TokenType, UserFromDatabase } from './user/interface'
import { Request } from 'express'
import { verify } from 'jsonwebtoken'
import { getDatabase } from './misc/getDatabase'
import SQL from 'sql-template-strings'
import { fromDatabase } from './user/model'

export const getContext = async ({
  req
}: {
  req: Request
}): Promise<Context> => {
  if (!req.headers.authorization || req.headers.authorization.length < 7) {
    return {}
  }

  const accessToken = req.headers.authorization.substring(7)
  let token: Token

  try {
    token = verify(accessToken, process.env.SECRET!) as Token
  } catch (ex) {
    return {}
  }

  if (token.type !== TokenType.ACCESS || !token.id) {
    return {}
  }

  const db = await getDatabase()
  const user = await db.get<UserFromDatabase>(
    SQL`SELECT * FROM user WHERE id = ${token.id}`
  )

  if (!user) {
    return {}
  }

  return { user: fromDatabase(user) }
}
