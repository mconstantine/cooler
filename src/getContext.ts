import { Context, Token, TokenType, UserFromDatabase } from './user/interface'
import { verify } from 'jsonwebtoken'
import { getDatabase } from './misc/getDatabase'
import SQL from 'sql-template-strings'
import { fromDatabase } from './user/model'
import { ExpressContext } from 'apollo-server-express/dist/ApolloServer'
import { SubscriptionServerOptions } from 'apollo-server-core/src'

async function validateToken(accessToken: string): Promise<Context> {
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

export const getContext = async ({
  req,
  connection
}: ExpressContext): Promise<Context> => {
  if (connection) {
    return connection.context
  }

  if (!req.headers.authorization || req.headers.authorization.length < 7) {
    return {}
  }

  const accessToken = req.headers.authorization.substring(7)

  return await validateToken(accessToken)
}

export const subscriptionOptions: Partial<SubscriptionServerOptions> = {
  onConnect: async (params: Object): Promise<Context> => {
    if ('accessToken' in params) {
      return await validateToken(params['accessToken'])
    } else {
      return {}
    }
  }
}
