import { ApolloServer } from 'apollo-server-express'
import { typeDefs } from './typeDefs'
import { resolvers } from './resolvers'
import { init } from './init'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { getContext } from './getContext'
;(async () => {
  dotenv.config()
  await init()

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: getContext
  })

  const app = express()

  server.applyMiddleware({ app })

  app
    .use('/public', express.static(path.join(process.cwd(), '/public')))
    .use('/', express.static(path.join(process.cwd(), '../cooler/build')))
    .use('*', (_req, res) =>
      res.sendFile(path.join(process.cwd(), '../cooler/build/index.html'))
    )
    .listen({ port: process.env.SERVER_PORT }, () => {
      console.log(`Server ready at http://localhost:${process.env.SERVER_PORT}`)
    })
})()
