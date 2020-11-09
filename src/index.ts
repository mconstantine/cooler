import { ApolloServer } from 'apollo-server-express'
import { typeDefs } from './typeDefs'
import { resolvers } from './resolvers'
import { init } from './init'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { getContext, subscriptionOptions } from './getContext'
import http from 'http'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'

async function start(): Promise<void> {
  dotenv.config()

  await pipe(
    init(),
    taskEither.bimap(
      error => Promise.reject(error),
      () => {
        const server = new ApolloServer({
          typeDefs,
          resolvers,
          context: getContext,
          subscriptions: subscriptionOptions
        })

        const app = express()
        const httpServer = http.createServer(app)

        server.applyMiddleware({ app })
        server.installSubscriptionHandlers(httpServer)

        app
          .use('/public', express.static(path.join(process.cwd(), '/public')))
          .use('/', express.static(path.join(process.cwd(), '../cooler/build')))
          .use('*', (_req, res) =>
            res.sendFile(path.join(process.cwd(), '../cooler/build/index.html'))
          )

        httpServer.listen({ port: process.env.SERVER_PORT }, () => {
          console.log(
            `Server ready at http://localhost:${process.env.SERVER_PORT}`
          )
        })
      }
    )
  )()
}

start().catch(e => console.log(e))
