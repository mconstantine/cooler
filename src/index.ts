import { ApolloServer } from 'apollo-server-express'
import { typeDefs } from './typeDefs'
import { resolvers } from './resolvers'
import { init } from './init'
import dotenv from 'dotenv'
import { Token, TokenType, User } from './user/interface'
import { verify } from 'jsonwebtoken'
import { getDatabase } from './misc/getDatabase'
import SQL from 'sql-template-strings'
import express from 'express'
import path from 'path'

(async () => {
  dotenv.config()
  await init()

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

  const app = express()

  server.applyMiddleware({ app })

  app.use(
    '/public', express.static(path.join(process.cwd(), '/public'))
  ).use(
    '/', express.static(path.join(process.cwd(), '../cooler/build'))
  ).use(
    '*', (_req, res) => res.sendFile(path.join(process.cwd(), '../cooler/build/index.html'))
  ).listen({ port: process.env.SERVER_PORT }, () => {
    console.log(`Server ready at http://localhost:${process.env.SERVER_PORT}`)
  })
})()
