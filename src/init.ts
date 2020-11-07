import initUser from './user/init'
// import initClient from './client/init'
// import initProject from './project/init'
// import initTask from './task/init'
// import initSession from './session/init'
// import initTax from './tax/init'
import { getDatabase } from './misc/getDatabase'
import { TaskEither } from 'fp-ts/TaskEither'
import { ApolloError } from 'apollo-server-express'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'

export function init(): TaskEither<ApolloError, void> {
  return pipe(
    getDatabase(),
    // TODO: restore migrations after project
    // taskEither.chain(db =>
    //   taskEither.tryCatch(
    //     () => db.migrate(),
    //     error => {
    //       console.log(error)
    //       return coolerError(
    //         'COOLER_500',
    //         'Unable to perform database migrations'
    //       )
    //     }
    //   )
    // ),
    taskEither.chain(() => initUser())
  )
  // await initUser()
  // await initClient()
  // await initProject()
  // await initTask()
  // await initSession()
  // await initTax()
  // const db = await getDatabase()
  // await db.migrate()
}
