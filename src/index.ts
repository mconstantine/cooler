import { ApolloServer } from 'apollo-server'
import { typeDefs } from './typeDefs'
import { resolvers } from './resolvers'
import initUser from './user/init'
import initClient from './client/init'
import initProject from './project/init'
import initTask from './task/init'
import dotenv from 'dotenv'
import { Token, TokenType, User } from './user/User'
import { verify } from 'jsonwebtoken'
import { getDatabase } from './misc/getDatabase'
import SQL from 'sql-template-strings'

(async () => {
  dotenv.config()

  await initUser()
  await initClient()
  await initProject()
  await initTask()

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      if (!req.headers.authorization || req.headers.authorization.length < 7) {
        return { user: null }
      }

      const accessToken = req.headers.authorization.substring(7)
      let token: Token

      try {
        token = verify(accessToken, process.env.SECRET!) as Token
      } catch (ex) {
        return { user: null }
      }

      if (token.type !== TokenType.ACCESS || !token.id) {
        return { user: null }
      }

      const db = await getDatabase()
      const user = await db.get<User>(SQL`SELECT * FROM user WHERE id = ${token.id}`)

      if (!user) {
        return { user: null }
      }

      return { user }
    }
  })

  server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
  })
})()
