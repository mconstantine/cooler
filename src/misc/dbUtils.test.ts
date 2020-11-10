import { option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { optionFromNullable } from 'io-ts-types'
import SQL from 'sql-template-strings'
import { pipeTestTaskEither, testError, testTaskEither } from '../test/util'
import { dbExec, dbGet, dbGetAll, insert, remove, update } from './dbUtils'
import { PositiveInteger } from './Types'

const Row = t.type(
  {
    id: PositiveInteger,
    key: t.string,
    value: t.string,
    optional: optionFromNullable(t.string)
  },
  'Row'
)
type Row = t.TypeOf<typeof Row>

const RowInput = t.type(
  {
    key: t.string,
    value: t.string,
    optional: optionFromNullable(t.string)
  },
  'RowInput'
)
type RowInput = t.TypeOf<typeof RowInput>

const RowUpateInput = t.partial(
  {
    key: t.string,
    value: t.string,
    optional: optionFromNullable(t.string)
  },
  'RowUpateInput'
)
type RowUpateInput = t.TypeOf<typeof RowUpateInput>

describe('dbUtils', () => {
  beforeAll(async () => {
    await dbExec(SQL`
      CREATE TABLE IF NOT EXISTS dbUtils (
        id INTEGER PRIMARY KEY,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        optional TEXT
      )
    `)()

    await dbExec(SQL`
      INSERT INTO dbUtils (
        key, value
      ) VALUES (
        "one", "1"
      ), (
        "two", "2"
      ), (
        "three", "3"
      )
    `)()
  })

  afterAll(async () => {
    await dbExec(SQL`DROP TABLE dbUtils`)()
  })

  describe('dbGet', () => {
    it('should work', async () => {
      await pipe(
        dbGet(SQL`SELECT * FROM dbUtils WHERE key = "one"`, Row),
        testTaskEither(row => {
          expect(option.isSome(row)).toBe(true)
        })
      )
    })
  })

  describe('dbAll', () => {
    it('should work', async () => {
      await pipe(
        dbGetAll(SQL`SELECT * FROM dbUtils`, Row),
        testTaskEither(rows => {
          expect(rows.length).toBeGreaterThan(0)
        })
      )
    })
  })

  describe('insert and remove', () => {
    it('should work', async () => {
      const data: RowInput = {
        key: 'seven',
        value: '7',
        optional: option.none
      }

      await pipe(
        insert('dbUtils', data, RowInput),
        pipeTestTaskEither(lastID => {
          expect(typeof lastID).toBe('number')
          expect(lastID).toBeGreaterThan(0)
        }),
        taskEither.chain(lastID => remove('dbUtils', { id: lastID })),
        testTaskEither(changes => {
          expect(changes).toBe(1)
        })
      )
    })

    it('should handle multiple rows', async () => {
      const data: RowInput[] = [
        {
          key: 'sixty',
          value: '42',
          optional: option.none
        },
        {
          key: 'eighty',
          value: '42',
          optional: option.none
        }
      ]

      await pipe(
        insert('dbUtils', data, RowInput),
        taskEither.chain(() => remove('dbUtils', { value: '42' })),
        testTaskEither(changes => {
          expect(changes).toBe(2)
        })
      )
    })

    it('should remove keys with undefined value', async () => {
      const data: RowInput[] = [
        {
          key: 'twenty',
          value: '20',
          optional: option.none
        },
        {
          key: 'twentyone',
          value: '20',
          optional: option.none
        }
      ]

      await pipe(
        insert('dbUtils', data, RowInput),
        taskEither.chain(() =>
          dbGetAll(SQL`SELECT * FROM dbUtils WHERE value = "20"`, Row)
        ),
        pipeTestTaskEither(rows => {
          expect(rows.length).toBe(2)
          expect(rows).toContainEqual(
            expect.objectContaining({ optional: option.none })
          )
        }),
        taskEither.chain(() => remove('dbUtils', { value: '20' })),
        testTaskEither(changes => {
          expect(changes).toBe(2)
        })
      )
    })
  })

  describe('update', () => {
    it('should work', async () => {
      const data: RowInput = {
        key: 'thirty',
        value: '30',
        optional: option.none
      }

      await pipe(
        insert('dbUtils', data, RowInput),
        pipeTestTaskEither(lastID => {
          expect(lastID).toBeGreaterThan(0)
        }),
        taskEither.chain(lastID =>
          pipe(
            update(
              'dbUtils',
              lastID,
              { key: 'thirty', value: '32' },
              RowUpateInput
            ),
            pipeTestTaskEither(changes => {
              expect(changes).toBe(1)
            }),
            taskEither.chain(() =>
              dbGet(SQL`SELECT * FROM dbUtils WHERE id = ${lastID}`, Row)
            ),
            taskEither.chain(taskEither.fromOption(testError)),
            pipeTestTaskEither(result => {
              expect(result.value).toBe('32')
            }),
            taskEither.chain(() => remove('dbUtils', { value: '32' }))
          )
        ),
        testTaskEither(changes => {
          expect(changes).toBe(1)
        })
      )
    })
  })
})
