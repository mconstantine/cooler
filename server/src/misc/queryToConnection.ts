import SQL, { SQLStatement } from 'sql-template-strings'
import { ConnectionQueryArgs } from './ConnectionQueryArgs'
import { Connection, Edge } from './Connection'
import {
  coolerError,
  PositiveInteger,
  NonNegativeInteger,
  CoolerError,
  unsafeNonEmptyString
} from './Types'
import { TaskEither } from 'fp-ts/TaskEither'
import { nonEmptyArray, option, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { dbGetAll } from './dbUtils'
import * as t from 'io-ts'
import { NonEmptyString } from 'io-ts-types'
import { a18n } from './a18n'

const ConnectionAddendum = t.type(
  {
    _n: NonNegativeInteger,
    _first: NonNegativeInteger,
    _last: NonNegativeInteger,
    totalCount: NonNegativeInteger
  },
  'ConnectionAddendum'
)
type ConnectionAddendum = t.TypeOf<typeof ConnectionAddendum>

/**
 * Runs a query as a GraphQL Connection and returns a Connection as a result
 * @param args the current query arguments
 * @param select auto explanatory. INCLUDE id HERE
 * @param from auto explanatory
 * @param orderBy auto explanatory
 * @param rest the rest of the query (WHERE, GROUP BY etc.) DO NOT PUT ORDER BY HERE
 */
export function queryToConnection<
  D extends { id: PositiveInteger },
  S extends { id: number }
>(
  args: ConnectionQueryArgs,
  select: string[],
  from: string,
  codec: t.Type<D, S>,
  rest?: SQLStatement
): TaskEither<CoolerError, Connection<D>> {
  if ((args.first && args.before) || (args.last && args.after)) {
    return taskEither.left(
      coolerError(
        'COOLER_400',
        a18n`You must use either "first" and "after" or "last" and "before". You cannot mix and match them`
      )
    )
  }

  const orderBy = args.orderBy ? `${from}.${args.orderBy}` : `${from}.id ASC`

  const query = SQL``.append(`
    WITH preset AS (
      SELECT ${select.join(', ')}, ROW_NUMBER() OVER(
        ORDER BY ${orderBy}
      ) AS _n
      FROM ${from}
  `)

  rest && query.append(rest)

  query.append(`
      ORDER BY ${orderBy}
    ),
    totalCount AS (
      SELECT COUNT(_n) AS count FROM preset
    ),
    firstId AS (
      SELECT id FROM preset WHERE _n = 1
    ),
    lastId AS (
      SELECT id FROM preset WHERE _n = (SELECT MAX(_n) FROM preset)
    )
    SELECT preset.*, firstId.id AS _first, lastId.id AS _last, totalCount.count AS totalCount
    FROM preset, firstId, lastId, totalCount
  `)

  if (args.after) {
    query.append(`
      WHERE _n > (SELECT _n FROM preset WHERE id = ${fromCursor(args.after)})
    `)
  } else if (args.before) {
    query.append(`
      WHERE _n < (SELECT _n FROM preset WHERE id = ${fromCursor(args.before)})
      ORDER BY _n DESC
    `)
  }

  if (args.first) {
    query.append(`
      LIMIT ${args.first}
    `)
  } else if (args.last) {
    query.append(`
      LIMIT ${args.last}
    `)
  }

  return pipe(
    dbGetAll(query, t.intersection([codec, ConnectionAddendum])),
    taskEither.map(
      flow(
        nonEmptyArray.fromArray,
        option.fold(
          () => ({
            totalCount: 0 as NonNegativeInteger,
            edges: [] as Edge<D>[],
            pageInfo: {
              startCursor: option.none,
              endCursor: option.none,
              hasPreviousPage: false,
              hasNextPage: false
            }
          }),
          records => {
            args.before && records.reverse()
            const firstResult = records[0]
            const lastResult = records[records.length - 1]

            return {
              totalCount: firstResult.totalCount,
              edges: records.map(record => ({
                node: Object.entries(record)
                  .filter(
                    ([key]) =>
                      !['_n', '_first', '_last', 'totalCount'].includes(key)
                  )
                  .reduce(
                    (res, [key, value]) => ({ ...res, [key]: value }),
                    {}
                  ) as D,
                cursor: toCursor(record.id)
              })),
              pageInfo: {
                startCursor: option.some(toCursor(firstResult.id)),
                endCursor: option.some(toCursor(lastResult.id)),
                hasPreviousPage: firstResult.id !== firstResult._first,
                hasNextPage: lastResult.id !== firstResult._last
              }
            }
          }
        )
      )
    )
  )
}

export function toCursor(value: number): NonEmptyString {
  return unsafeNonEmptyString(
    Buffer.from(value.toString(10)).toString('base64')
  )
}

function fromCursor(cursor: NonEmptyString): PositiveInteger {
  return parseInt(
    Buffer.from(cursor, 'base64').toString('ascii'),
    10
  ) as PositiveInteger
}
