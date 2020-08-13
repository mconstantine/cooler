import SQL, { SQLStatement } from 'sql-template-strings'
import { getDatabase } from './getDatabase'
import { ConnectionQueryArgs } from './ConnectionQueryArgs'
import { Connection } from './Connection'

/**
 * Runs a query as a GraphQL Connection and returns a Connection as a result
 * @param args the current query arguments
 * @param select auto explanatory. INCLUDE id HERE
 * @param from auto explanatory
 * @param orderBy auto explanatory
 * @param rest the rest of the query (WHERE, GROUP BY etc.) DO NOT PUT ORDER BY HERE
 */
export async function queryToConnection<T extends { id: number }>(
  args: ConnectionQueryArgs,
  select: string[],
  from: string,
  rest?: SQLStatement
): Promise<Connection<T>> {
  if ((args.first && args.before) || (args.last && args.after)) {
    throw new Error('You must use either "first" and "after" or "last" and "before". You cannot mix and match them')
  }

  const orderBy = args.orderBy ? `${from}.${args.orderBy}` : `${from}.id ASC`

  const query = SQL``.append(`
    WITH preset as (
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

  const db = await getDatabase()

  const results = await db.all<Array<T & {
    _n: number,
    _first: number,
    _last: number,
    totalCount: number
  }>>(query)

  if (!results.length) {
    return {
      totalCount: 0,
      edges: [],
      pageInfo: {
        startCursor: '',
        endCursor: '',
        hasPreviousPage: false,
        hasNextPage: false
      }
    }
  }

  args.before && results.reverse()

  const firstResult = results[0]
  const lastResult = results[results.length - 1]
  const first = firstResult._first
  const last = firstResult._last

  return {
    totalCount: firstResult.totalCount,
    edges: results.map(
      result => ({
        node: Object.entries(result).filter(
          ([key]) => !['_n', '_first', '_last', 'totalCount'].includes(key)
        ).reduce(
          (res, [key, value]) => ({ ...res, [key]: value }), {}
        ) as T,
        cursor: toCursor(result.id)
      })
    ),
    pageInfo: {
      startCursor: toCursor(first),
      endCursor: toCursor(last),
      hasPreviousPage: firstResult.id !== first,
      hasNextPage: lastResult.id !== last
    }
  }
}

export function toCursor(value: number): string {
  return Buffer.from(value.toString(10)).toString('base64')
}

function fromCursor(cursor: string): number {
  return parseInt(Buffer.from(cursor, 'base64').toString('ascii'), 10)
}
