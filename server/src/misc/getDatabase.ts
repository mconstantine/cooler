import { cached } from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'
import { TaskEither } from 'fp-ts/TaskEither'
import { Option } from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { option, taskEither } from 'fp-ts'
import { ApolloError } from 'apollo-server-express'
import { coolerError } from './Types'

let database: Option<Database> = option.none

export function getDatabase(): TaskEither<ApolloError, Database> {
  return pipe(
    database,
    option.fold(
      () =>
        pipe(
          taskEither.tryCatch(
            () =>
              open({
                filename:
                  process.env.NODE_ENV === 'test'
                    ? ':memory:'
                    : path.join(process.cwd(), 'data.db'),
                driver: cached.Database
              }),
            error => {
              console.log(error)
              return coolerError('COOLER_500', 'Unable to access database')
            }
          ),
          taskEither.map(db => {
            database = option.some(db)
            return db
          })
        ),
      database => taskEither.fromIO(() => database)
    )
  )
}
