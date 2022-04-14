import { TaskEither } from 'fp-ts/TaskEither'
import { constVoid, identity, pipe } from 'fp-ts/function'
import { readerTaskEither, taskEither } from 'fp-ts'
import { CoolerError, coolerError } from './Types'
import { a18n } from './a18n'
import { MongoClient, Db, Collection as MongoCollection } from 'mongodb'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { Collection } from './Entity'

const uri = process.env.MONGODB_CONNECTION_URI
const dbName = process.env.NODE_ENV === 'test' ? 'test' : 'cooler'

if (!uri) {
  throw new Error('MONGODB_CONNECTION_URI is not set in envoronment file.')
}

export function withDatabase<T>(
  op: ReaderTaskEither<Db, CoolerError, T>
): TaskEither<CoolerError, T> {
  const client = new MongoClient(uri!)

  return taskEither.bracket(
    pipe(
      taskEither.tryCatch(
        () =>
          client
            .connect()
            .then(client => client.db(dbName).command({ ping: 1 }))
            .then(() => client),
        error => {
          console.log(error)
          return coolerError('COOLER_500', a18n`Unable to access database`)
        }
      )
    ),
    client => op(client.db(dbName)),
    () =>
      taskEither.tryCatch(
        () => client.close().then(constVoid),
        error => {
          console.log(error)
          return coolerError(
            'COOLER_500',
            a18n`Unable to close connection to database`
          )
        }
      )
  )
}

export function withCollection<I, O, T>(
  collection: Collection<I, O>,
  op: ReaderTaskEither<MongoCollection<I>, CoolerError, T>
): TaskEither<CoolerError, T> {
  return withDatabase(db => op(db.collection<I>(collection.name)))
}
