import * as t from 'io-ts'
import { either, option, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { withDatabase } from './withDatabase'
import { CoolerError, coolerError } from './Types'
import { Option } from 'fp-ts/Option'
import { reportDecodeErrors } from './reportDecodeErrors'
import { a18n } from './a18n'
import { Collection, WithIdC } from './Entity'
import { Reader } from 'fp-ts/Reader'
import {
  WithId,
  Collection as MongoCollection,
  Document,
  InsertOneResult,
  InsertManyResult,
  UpdateResult,
  MatchKeysAndValues,
  DeleteResult,
  Filter
} from 'mongodb'
import { IO } from 'fp-ts/IO'

export function dbGet<I, O>(
  collection: Collection<I, O>,
  match: Partial<WithId<O>>
): TaskEither<CoolerError, Option<WithId<O>>>
export function dbGet<I, O>(
  collection: Collection<I, O>,
  useCollection: Reader<MongoCollection<WithId<I>>, Promise<WithId<I> | null>>
): TaskEither<CoolerError, Option<WithId<O>>>
export function dbGet<I, O>(
  collection: Collection<I, O>,
  match:
    | Partial<WithId<O>>
    | Reader<MongoCollection<WithId<I>>, Promise<WithId<I> | null>>
): TaskEither<CoolerError, Option<WithId<O>>> {
  const origin = `Collection: ${collection.name}`

  return withDatabase(db =>
    pipe(
      taskEither.tryCatch(
        () => {
          if (typeof match === 'object') {
            const MatchType = t.partial(
              collection.props,
              `Partial<${collection.codec.name}>`
            )

            const query = MatchType.encode(match)

            return db.collection(collection.name).findOne(query)
          } else {
            return match(db.collection(collection.name))
          }
        },
        error => {
          console.log(error)
          return coolerError(
            'COOLER_500',
            a18n`Error while finding one. ${origin}`
          )
        }
      ),
      taskEither.chain(
        flow(
          option.fromNullable,
          option.fold(
            () => taskEither.right(option.none),
            flow(
              WithIdC(collection.codec).decode,
              reportDecodeErrors(origin),
              either.mapLeft(() =>
                coolerError('COOLER_500', a18n`Error while decoding`)
              ),
              either.map(option.some),
              taskEither.fromEither
            )
          )
        )
      )
    )
  )
}

export function dbGetAll<I, O>(
  collection: Collection<I, O>,
  match: Partial<WithId<O>>
): TaskEither<CoolerError, Array<WithId<O>>>
export function dbGetAll<I, O>(
  collection: Collection<I, O>,
  useCollection: Reader<MongoCollection<WithId<I>>, Promise<WithId<I>[]>>
): TaskEither<CoolerError, Array<WithId<O>>>
export function dbGetAll<I, O>(
  collection: Collection<I, O>,
  match: Partial<WithId<O>> | Reader<MongoCollection<I>, Promise<WithId<I>[]>>
): TaskEither<CoolerError, Array<WithId<O>>> {
  const origin = `Collection: ${collection.name}.`

  return pipe(
    withDatabase(db =>
      pipe(
        taskEither.tryCatch(
          () => {
            const cursor = db.collection<I>(collection.name)

            if (typeof match === 'object') {
              const QueryType = t.partial(collection.props)
              const query = QueryType.encode(match)

              return cursor.find(query).toArray()
            } else {
              return match(cursor)
            }
          },
          error => {
            console.log(error)
            return coolerError(
              'COOLER_500',
              a18n`Error while finding many. ${origin}`
            )
          }
        ),
        taskEither.chain(
          flow(
            t.array(WithIdC(collection.codec)).decode,
            reportDecodeErrors(origin),
            either.mapLeft(() =>
              coolerError('COOLER_500', a18n`Error while decoding`)
            ),
            taskEither.fromEither
          )
        )
      )
    )
  )
}

export function insertOne<I, O>(
  collection: Collection<I, O>,
  doc: Partial<O>
): TaskEither<CoolerError, InsertOneResult> {
  const DocType = t.partial(collection.props)
  const encodedDoc = DocType.encode(doc)

  const origin = `Collection: ${collection.name}. Document: ${JSON.stringify(
    encodedDoc
  )}`

  if ('createdAt' in collection.props) {
    encodedDoc.createdAt = new Date()
  }

  if ('updatedAt' in collection.props) {
    encodedDoc.updatedAt = new Date()
  }

  return withDatabase(db =>
    pipe(
      taskEither.tryCatch(
        () => db.collection(collection.name).insertOne(encodedDoc),
        error => {
          console.log(error)
          return coolerError(
            'COOLER_500',
            a18n`Error while inserting one. ${origin}`
          )
        }
      )
    )
  )
}

export function insertMany<I, O>(
  collection: Collection<I, O>,
  docs: Array<Partial<O>>
): TaskEither<CoolerError, InsertManyResult> {
  const DocType = t.partial(collection.props)
  const encodedDocs = t.array(DocType).encode(docs)
  const origin = `Collection: ${collection.name}.`

  if ('createdAt' in collection.props) {
    encodedDocs.forEach(doc => (doc.createdAt = new Date()))
  }

  if ('updatedAt' in collection.props) {
    encodedDocs.forEach(doc => (doc.updatedAt = new Date()))
  }

  return withDatabase(db =>
    pipe(
      taskEither.tryCatch(
        () => db.collection(collection.name).insertMany(encodedDocs),
        error => {
          console.log(error)
          return coolerError(
            'COOLER_500',
            a18n`Error while inserting many. ${origin}`
          )
        }
      )
    )
  )
}

export function updateOne<I, O>(
  collection: Collection<I, O>,
  match: Partial<WithId<O>>,
  update: Partial<O>
): TaskEither<CoolerError, UpdateResult> {
  const QueryType = t.partial(collection.props)
  const UpdateType = t.partial(collection.props)
  const query = QueryType.encode(match)
  const encodedUpdate = UpdateType.encode(update)

  const origin = `Collection: ${collection.name}. Query: ${JSON.stringify(
    query
  )} Document: ${JSON.stringify(encodedUpdate)}`

  if ('updatedAt' in collection.props) {
    encodedUpdate.updatedAt = new Date()
  }

  return withDatabase(db =>
    pipe(
      taskEither.tryCatch(
        () =>
          db
            .collection(collection.name)
            .updateOne(query, { $set: encodedUpdate }),
        error => {
          console.log(error)
          return coolerError(
            'COOLER_500',
            a18n`Error while updating one. ${origin}`
          )
        }
      )
    )
  )
}

export function updateMany<I, O>(
  collection: Collection<I, O>,
  match: Partial<WithId<O>>,
  update: Partial<O>
): TaskEither<CoolerError, UpdateResult | Document>
export function updateMany<I, O>(
  collection: Collection<I, O>,
  getFilter: IO<Filter<WithId<I>>>,
  update: Partial<O>
): TaskEither<CoolerError, UpdateResult | Document>
export function updateMany<I, O>(
  collection: Collection<I, O>,
  match: Partial<WithId<O>> | IO<Filter<WithId<I>>>,
  update: Partial<O>
): TaskEither<CoolerError, UpdateResult | Document> {
  const UpdateType = t.partial(collection.props)
  const encodedUpdate = UpdateType.encode(update) as MatchKeysAndValues<I>
  const origin = `Collection: ${collection.name}.`

  if ('updatedAt' in collection.props) {
    // @ts-ignore - The collection props and the update are always the same type
    encodedUpdate.updatedAt = new Date()
  }

  return withDatabase(db =>
    pipe(
      taskEither.tryCatch(
        () => {
          if (typeof match === 'object') {
            const QueryType = t.partial(collection.props)
            const query = QueryType.encode(match)

            return db
              .collection<I>(collection.name)
              .updateMany(query, { $set: encodedUpdate })
          } else {
            return db
              .collection<WithId<I>>(collection.name)
              .updateMany(match(), {
                $set: encodedUpdate as MatchKeysAndValues<WithId<I>>
              })
          }
        },
        error => {
          console.log(error)
          return coolerError(
            'COOLER_500',
            a18n`Error while updating many. ${origin}`
          )
        }
      )
    )
  )
}

export function deleteOne<I, O>(
  collection: Collection<I, O>,
  match: Partial<WithId<O>>
): TaskEither<CoolerError, DeleteResult> {
  const QueryType = t.partial(collection.props)
  const query = QueryType.encode(match)

  const origin = `Collection: ${collection.name}. Query: ${JSON.stringify(
    query
  )}`

  return withDatabase(db =>
    pipe(
      taskEither.tryCatch(
        () => db.collection(collection.name).deleteOne(query),
        error => {
          console.log(error)
          return coolerError(
            'COOLER_500',
            a18n`Error while deleting one. ${origin}`
          )
        }
      )
    )
  )
}

export function deleteMany<I, O>(
  collection: Collection<I, O>,
  match: Partial<WithId<O>>
): TaskEither<CoolerError, DeleteResult>
export function deleteMany<I, O>(
  collection: Collection<I, O>,
  getFilter: IO<Filter<WithId<I>>>
): TaskEither<CoolerError, DeleteResult>
export function deleteMany<I, O>(
  collection: Collection<I, O>,
  match: Partial<WithId<O>> | IO<Filter<WithId<I>>>
): TaskEither<CoolerError, DeleteResult> {
  const QueryType = t.partial(collection.props)
  const query = QueryType.encode(match)

  const origin = `Collection: ${collection.name}. Query: ${JSON.stringify(
    query
  )}.`

  return withDatabase(db =>
    pipe(
      taskEither.tryCatch(
        () => {
          if (typeof match === 'object') {
            return db.collection<I>(collection.name).deleteMany(query)
          } else {
            return db.collection<WithId<I>>(collection.name).deleteMany(match())
          }
        },
        error => {
          console.log(error)
          return coolerError(
            'COOLER_500',
            a18n`Error while deleting many. ${origin}`
          )
        }
      )
    )
  )
}
