import initUser from './user/init'
import initClient from './client/init'
import initProject from './project/init'
import initTask from './task/init'
import initSession from './session/init'
import initTax from './tax/init'
import { TaskEither } from 'fp-ts/TaskEither'
import { ApolloError } from 'apollo-server-express'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import { getDatabase } from './misc/getDatabase'
import { coolerError } from './misc/Types'

export function init(): TaskEither<ApolloError, void> {
  return pipe(
    initUser(),
    taskEither.chain(initClient),
    taskEither.chain(initProject),
    taskEither.chain(initTask),
    taskEither.chain(initSession),
    taskEither.chain(initTax),
    taskEither.chain(getDatabase),
    taskEither.chain(db =>
      taskEither.tryCatch(
        () => db.migrate(),
        error => {
          console.log(error)
          return coolerError(
            'COOLER_500',
            'Unable to perform database migrations'
          )
        }
      )
    )
  )
}
