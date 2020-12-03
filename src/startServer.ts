import { ApolloError, ApolloServer } from 'apollo-server-express'
import { typeDefs } from './typeDefs'
import { resolvers } from './resolvers'
import { init } from './init'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { getContext, subscriptionOptions } from './getContext'
import http from 'http'
import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'

function listen(server: http.Server): Promise<TaskEither<Error, void>> {
  return new Promise((resolve, reject) => {
    try {
      server.listen({ port: process.env.SERVER_PORT }, () =>
        resolve(
          taskEither.tryCatch(
            () =>
              new Promise((resolve, reject) => {
                server.close(error => {
                  if (error) {
                    reject(error)
                  } else {
                    resolve()
                  }
                })
              }),
            error => error as Error
          )
        )
      )
    } catch (e) {
      reject(e)
    }
  })
}

export function startServer(): TaskEither<
  ApolloError,
  TaskEither<Error, void>
> {
  dotenv.config()

  return pipe(
    init(),
    taskEither.chain(() =>
      taskEither.fromTask(() => {
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

        return listen(httpServer)
      })
    )
  )
}
