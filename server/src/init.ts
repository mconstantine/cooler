import initUser from './user/init'
import initClient from './client/init'
import initProject from './project/init'
import initTask from './task/init'
import initSession from './session/init'
import initTax from './tax/init'
import { TaskEither } from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import { getDatabase } from './misc/getDatabase'
import { CoolerError, coolerError } from './misc/Types'
import { a18n } from './misc/a18n'

export function init(): TaskEither<CoolerError, void> {
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
            a18n`Unable to perform database migrations`
          )
        }
      )
    )
  )
}
