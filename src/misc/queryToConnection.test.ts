import SQL from 'sql-template-strings'
import { queryToConnection, toCursor } from './queryToConnection'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { dbExec, insert } from './dbUtils'
import { option, taskEither } from 'fp-ts'
import { PositiveInteger } from './Types'
import { NonEmptyString, optionFromNullable } from 'io-ts-types'
import { getDatabase } from './getDatabase'
import { testError, testTaskEither } from '../test/util'
import { getConnectionNodes } from '../test/getConnectionNodes'

describe('queryToConnection', () => {
  describe('usage', () => {
    const Data = t.type(
      {
        id: PositiveInteger,
        char: t.string,
        number: t.number
      },
      'Data'
    )
    type Data = t.TypeOf<typeof Data>

    const DataInput = t.type(
      {
        char: t.string,
        number: t.number
      },
      'DataInput'
    )
    type DataInput = t.TypeOf<typeof DataInput>

    const data = [] as Data[]

    beforeAll(async () => {
      const dataInput: DataInput[] = [
        {
          char: 'A',
          number: 4
        },
        {
          char: 'C',
          number: 3
        },
        {
          char: 'B',
          number: 2
        },
        {
          char: 'D',
          number: 1
        }
      ]

      await dbExec(SQL`
        CREATE TABLE IF NOT EXISTS queryToConnectionUsage (
          id INTEGER PRIMARY KEY,
          char TEXT NOT NULL,
          number INTEGER NOT NULL
        )
      `)()

      for (const input of dataInput) {
        await pipe(
          insert('queryToConnectionUsage', input, DataInput),
          taskEither.map(id => {
            data.push({ ...input, id })
          })
        )()
      }

      expect(data).toEqual([
        { id: 1, char: 'A', number: 4 },
        { id: 2, char: 'C', number: 3 },
        { id: 3, char: 'B', number: 2 },
        { id: 4, char: 'D', number: 1 }
      ])
    })

    afterAll(async () => {
      await dbExec(SQL`DROP TABLE queryToConnectionUsage`)()
    })

    it('should work', async () => {
      await pipe(
        queryToConnection(
          {},
          ['id', 'char', 'number'],
          'queryToConnectionUsage',
          Data
        ),
        testTaskEither(result => {
          expect(result.totalCount).toBe(4)
          expect(result.edges.length).toBe(4)
          expect(getConnectionNodes(result)).toEqual(data)

          const startCursor = result.edges[0].cursor
          const endCursor = result.edges[3].cursor

          expect(result.pageInfo.startCursor).toEqual(option.some(startCursor))
          expect(result.pageInfo.endCursor).toEqual(option.some(endCursor))
          expect(result.pageInfo.hasNextPage).toBe(false)
          expect(result.pageInfo.hasPreviousPage).toBe(false)
        })
      )
    })

    it('should handle "first" and "after" (two per page)', async () => {
      /*
      [
        { id: 2, char: 'C', number: 3 },
        { id: 1, char: 'A', number: 4 }
      ]
      */
      await pipe(
        queryToConnection(
          {
            first: 2 as PositiveInteger,
            after: toCursor(3),
            orderBy: 'number ASC' as NonEmptyString
          },
          ['id', 'char', 'number'],
          'queryToConnectionUsage',
          Data
        ),
        testTaskEither(result => {
          expect(result.totalCount).toBe(4)
          expect(result.edges.length).toBe(2)
          expect(getConnectionNodes(result)).toEqual([data[1], data[0]])
          expect(result.pageInfo.startCursor).toEqual(option.some(toCursor(2)))
          expect(result.pageInfo.endCursor).toEqual(option.some(toCursor(1)))
          expect(result.pageInfo.hasNextPage).toBe(false)
          expect(result.pageInfo.hasPreviousPage).toBe(true)
        })
      )
    })

    it('should handle "first" and "after" (one per page)', async () => {
      /*
      [
        { id: 2, char: 'C', number: 3 }
      ]
      */
      await pipe(
        queryToConnection(
          {
            first: 1 as PositiveInteger,
            after: toCursor(3),
            orderBy: 'number ASC' as NonEmptyString
          },
          ['id', 'char', 'number'],
          'queryToConnectionUsage',
          Data
        ),
        testTaskEither(result => {
          expect(result.totalCount).toBe(4)
          expect(result.edges.length).toBe(1)
          expect(getConnectionNodes(result)).toEqual([data[1]])
          expect(result.pageInfo.startCursor).toEqual(option.some(toCursor(2)))
          expect(result.pageInfo.endCursor).toEqual(option.some(toCursor(2)))
          expect(result.pageInfo.hasNextPage).toBe(true)
          expect(result.pageInfo.hasPreviousPage).toBe(true)
        })
      )
    })

    it('should handle "last" and "before" (one per page)', async () => {
      /*
      [
        { id: 3, char: 'B', number: 2 }
      ]
      */
      await pipe(
        queryToConnection(
          {
            last: 1 as PositiveInteger,
            before: toCursor(2),
            orderBy: 'char ASC' as NonEmptyString
          },
          ['id', 'char', 'number'],
          'queryToConnectionUsage',
          Data,
          SQL`WHERE char != ${'D'}`
        ),
        testTaskEither(result => {
          expect(result.totalCount).toBe(3)
          expect(result.edges.length).toBe(1)
          expect(getConnectionNodes(result)).toEqual([data[2]])
          expect(result.pageInfo.startCursor).toEqual(option.some(toCursor(3)))
          expect(result.pageInfo.endCursor).toEqual(option.some(toCursor(3)))
          expect(result.pageInfo.hasNextPage).toBe(true)
          expect(result.pageInfo.hasPreviousPage).toBe(true)
        })
      )
    })

    it('should handle "last" and "before" (two per page)', async () => {
      /*
      [
        { id: 1, char: 'A', number: 4 },
        { id: 3, char: 'B', number: 2 }
      ]
      */
      await pipe(
        queryToConnection(
          {
            last: 2 as PositiveInteger,
            before: toCursor(2),
            orderBy: 'char ASC' as NonEmptyString
          },
          ['id', 'char', 'number'],
          'queryToConnectionUsage',
          Data,
          SQL`WHERE char != ${'D'}`
        ),
        testTaskEither(result => {
          expect(result.totalCount).toBe(3)
          expect(result.edges.length).toBe(2)
          expect(getConnectionNodes(result)).toEqual([data[0], data[2]])
          expect(result.pageInfo.startCursor).toEqual(option.some(toCursor(1)))
          expect(result.pageInfo.endCursor).toEqual(option.some(toCursor(3)))
          expect(result.pageInfo.hasNextPage).toBe(true)
          expect(result.pageInfo.hasPreviousPage).toBe(false)
        })
      )
    })

    it('should handle empty results', async () => {
      await pipe(
        queryToConnection(
          {},
          ['id', 'char', 'number'],
          'queryToConnectionUsage',
          Data,
          SQL`WHERE char = ${'Z'}`
        ),
        testTaskEither(result => {
          expect(result.totalCount).toBe(0)
          expect(result.edges.length).toBe(0)
          expect(result.pageInfo.startCursor).toEqual(option.none)
          expect(result.pageInfo.endCursor).toEqual(option.none)
          expect(result.pageInfo.hasNextPage).toBe(false)
          expect(result.pageInfo.hasPreviousPage).toBe(false)
        })
      )
    })
  })

  describe('data encoding', () => {
    const Data = t.type(
      {
        id: PositiveInteger,
        content: optionFromNullable(t.string)
      },
      'Data'
    )
    type Data = t.TypeOf<typeof Data>

    const DataInput = t.type(
      {
        content: optionFromNullable(t.string)
      },
      'DataInput'
    )
    type DataInput = t.TypeOf<typeof DataInput>

    beforeAll(async () => {
      await dbExec(SQL`
        CREATE TABLE queryToConnectionEncoding (
          id INTEGER PRIMARY KEY,
          content TEXT
        )
      `)()
    })

    afterAll(async () => {
      await dbExec(SQL`DROP TABLE queryToConnectionEncoding`)()
    })

    it('should work', async () => {
      const row: DataInput = {
        content: option.none
      }

      await pipe(
        insert('queryToConnectionEncoding', row, DataInput),
        taskEither.chain(id =>
          pipe(
            getDatabase(),
            taskEither.chain(db =>
              taskEither.tryCatch(
                () =>
                  db.get<{ content: string | null }>(
                    SQL`SELECT * FROM queryToConnectionEncoding WHERE id = ${id}`
                  ),
                testError
              )
            )
          )
        ),
        testTaskEither(result => {
          expect(result?.content).toBeNull()
        })
      )

      await pipe(
        queryToConnection({}, ['*'], 'queryToConnectionEncoding', Data),
        testTaskEither(result => {
          expect(result.edges[0].node.content).toEqual(option.none)
        })
      )
    })
  })
})
