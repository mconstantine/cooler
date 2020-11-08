import { either, nonEmptyArray, option, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { ISqlite } from 'sqlite'
import { getDatabase } from './getDatabase'
import { removeUndefined } from './removeUndefined'
import { coolerError, PositiveInteger } from './Types'
import { Statement } from 'sqlite3'
import { SQLStatement } from 'sql-template-strings'
import { Option } from 'fp-ts/Option'
import { ApolloError } from 'apollo-server-express'
import { Type } from 'io-ts'
import { reportDecodeErrors } from './reportDecodeErrors'
import { sequenceT } from 'fp-ts/lib/Apply'

export function dbRun(
  sql: ISqlite.SqlType,
  ...args: any[]
): TaskEither<ApolloError, ISqlite.RunResult<Statement>> {
  return pipe(
    getDatabase(),
    taskEither.chain(db =>
      taskEither.tryCatch(
        () => db.run(sql, ...args),
        error => {
          console.log(error)
          return coolerError(
            'COOLER_500',
            'Unable to run statement against database'
          )
        }
      )
    )
  )
}

export function dbExec(sql: SQLStatement): TaskEither<ApolloError, void> {
  return pipe(
    getDatabase(),
    taskEither.chain(db =>
      taskEither.tryCatch(
        () => db.exec(sql),
        error => {
          console.log(error)
          return coolerError(
            'COOLER_500',
            'Unable to exec statement against database'
          )
        }
      )
    )
  )
}

export function dbGet<S, D>(
  sql: SQLStatement,
  codec: Type<D, S>
): TaskEither<ApolloError, Option<D>> {
  return pipe(
    getDatabase(),
    taskEither.chain(db =>
      taskEither.tryCatch(
        () => db.get<S>(sql),
        error => {
          console.log(error)
          return coolerError('COOLER_500', 'Unable to get from database')
        }
      )
    ),
    taskEither.map(option.fromNullable),
    taskEither.chain(record =>
      taskEither.fromEither(
        pipe(
          record,
          option.fold(
            () => either.right(option.none),
            flow(
              codec.decode,
              reportDecodeErrors(codec.name),
              either.bimap(
                () =>
                  coolerError(
                    'COOLER_500',
                    'Unable to decode record from database'
                  ),
                option.some
              )
            )
          )
        )
      )
    )
  )
}

export function dbGetAll<S, D>(
  sql: SQLStatement,
  codec: Type<D, S>
): TaskEither<ApolloError, D[]> {
  return pipe(
    getDatabase(),
    taskEither.chain(db =>
      taskEither.tryCatch(
        () => db.all<S[]>(sql),
        error => {
          console.log(error)
          return coolerError('COOLER_500', 'Unable to get from database')
        }
      )
    ),
    taskEither.chain(records =>
      taskEither.fromEither(
        pipe(
          records,
          nonEmptyArray.fromArray,
          option.fold(
            () => either.right([]),
            flow(
              nonEmptyArray.map(codec.decode),
              // @ts-ignore
              records => sequenceT(either.either)(...records),
              either.mapLeft(() =>
                coolerError(
                  'COOLER_500',
                  'Unable to decode records from database'
                )
              )
            )
          )
        )
      )
    )
  )
}

/**
 * Inserts one or more rows into the database. Every key in `_rows` that has a value of
 * `undefined` will _not_ be inserted.
 * @param _tableName the table in which to insert the row(s)
 * @param _rows the row(s) to be inserted, as objects
 */
export function insert<D extends Record<string, any>, S>(
  tableName: string,
  _rows: D | D[],
  codec: Type<D, S>
): TaskEither<ApolloError, PositiveInteger> {
  const rows: S[] = pipe(
    Array.isArray(_rows) ? _rows : [_rows],
    rows => rows.map(removeUndefined) as D[],
    rows => rows.map(codec.encode)
  )

  const columns = `\`${Object.keys(rows[0]).join('`, `')}\``

  const values = `${rows
    .map(row => new Array(Object.keys(row).length).fill('?').join(', '))
    .join('), (')}`

  const query = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`
  const args = rows.map(row => Object.values(row)).flat()

  return pipe(
    dbRun(query, ...args),
    taskEither.map(({ lastID }) => lastID as PositiveInteger)
  )
}

export function update<D extends Record<string, any>, S>(
  tableName: string,
  id: PositiveInteger,
  row: D,
  codec: Type<D, S>
): TaskEither<ApolloError, PositiveInteger> {
  const encodedRow = codec.encode(row)

  // Magic reduce from { key: value } to [['key = ?'], [value]]
  const [query, args] = Object.entries(removeUndefined(encodedRow))
    .filter(([key]) => key !== 'id')
    .reduce(
      ([query, args], [key, value]) => {
        return [
          [...query, `\`${key}\` = ?`],
          [...args, value]
        ]
      },
      [[], []] as [string[], any[]]
    )

  return pipe(
    dbRun(
      `UPDATE ${tableName} SET ${query.join(', ')} WHERE \`id\` = ?`,
      ...args,
      id
    ),
    taskEither.map(({ changes }) => changes as PositiveInteger)
  )
}

export function remove<T extends Record<string, any>>(
  tableName: string,
  where?: Partial<T>
): TaskEither<ApolloError, PositiveInteger> {
  let query = `DELETE FROM ${tableName}`
  let args = [] as any[]

  if (where && Object.keys(where).length) {
    const whereStatement = Object.keys(where)
      .map(key => `\`${key}\` = ?`)
      .join(' AND ')

    query += ` WHERE ${whereStatement}`
    args = Object.values(where)
  }

  return pipe(
    dbRun(query, ...args),
    taskEither.map(({ changes }) => changes as PositiveInteger)
  )
}
