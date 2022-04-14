import { assignResolvers } from './assignResolvers'
import dotenv from 'dotenv'
import express, { Express } from 'express'
import path from 'path'
import { taskEither } from 'fp-ts'
import { TaskEither } from 'fp-ts/TaskEither'
import { initI18n } from './misc/a18n'
import { CoolerError } from './misc/Types'
import cors from 'cors'

function listen(app: Express): Promise<TaskEither<Error, void>> {
  return new Promise((resolve, reject) => {
    try {
      const server = app.listen({ port: process.env.SERVER_PORT }, () =>
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
  CoolerError,
  TaskEither<Error, void>
> {
  dotenv.config()
  initI18n()

  return taskEither.fromTask(() => {
    const app = express()

    app.use(cors({ origin: '*' }))

    assignResolvers(app)

    app
      .use('/public', express.static(path.join(process.cwd(), '/public')))
      .use('/', express.static(path.join(process.cwd(), '../cooler/build')))
      .use('*', (_req, res) =>
        res.sendFile(path.join(process.cwd(), '../cooler/build/index.html'))
      )

    return listen(app)
  })
}
