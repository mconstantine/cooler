import { option, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import * as t from 'io-ts'
import { optionFromNullable } from 'io-ts-types'
import SQL from 'sql-template-strings'
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
      const row = await pipe(
        dbGet(SQL`SELECT * FROM dbUtils WHERE key = "one"`, Row),
        taskEither.getOrElse(() =>
          task.fromIO(() => option.none as Option<Row>)
        )
      )()

      expect(option.isSome(row)).toBe(true)
    })
  })

  describe('dbAll', () => {
    it('should work', async () => {
      const rows = await pipe(
        dbGetAll(SQL`SELECT * FROM dbUtils`, Row),
        taskEither.getOrElse(() => task.fromIO(() => [] as Row[]))
      )()

      expect(rows.length).toBeGreaterThan(0)
    })
  })

  describe('insert and remove', () => {
    it('should work', async () => {
      const data: RowInput = {
        key: 'seven',
        value: '7',
        optional: option.none
      }

      const lastID = await pipe(
        insert('dbUtils', data, RowInput),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(typeof lastID).toBe('number')
      expect(lastID).toBeGreaterThan(0)

      const changes = await pipe(
        remove('dbUtils', { id: lastID }),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(changes).toBe(1)
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

      await insert('dbUtils', data, RowInput)()

      const changes = await pipe(
        remove('dbUtils', { value: '42' }),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(changes).toBe(2)
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

      await insert('dbUtils', data, RowInput)()

      const rows = await pipe(
        dbGetAll(SQL`SELECT * FROM dbUtils WHERE value = "20"`, Row),
        taskEither.getOrElse(() => task.fromIO(() => [] as Row[]))
      )()

      expect(rows.length).toBe(2)
      expect(rows).toContainEqual(
        expect.objectContaining({ optional: option.none })
      )

      const changes = await pipe(
        remove('dbUtils', { value: '20' }),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(changes).toBe(2)
    })
  })

  describe('update', () => {
    it('should work', async () => {
      const data: RowInput = {
        key: 'thirty',
        value: '30',
        optional: option.none
      }

      const lastID = await pipe(
        insert('dbUtils', data, RowInput),
        taskEither.getOrElse(() => task.fromIO(() => 0 as PositiveInteger))
      )()

      expect(lastID).toBeGreaterThan(0)

      let changes = await pipe(
        update(
          'dbUtils',
          lastID,
          { key: 'thirty', value: '32' },
          RowUpateInput
        ),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(changes).toBe(1)

      const result = await pipe(
        dbGet(SQL`SELECT * FROM dbUtils WHERE id = ${lastID}`, Row),
        taskEither.getOrElse(() =>
          task.fromIO(() => option.none as Option<Row>)
        )
      )()

      expect(option.isSome(result)).toBe(true)
      expect((result as option.Some<Row>).value.value).toBe('32')

      changes = await pipe(
        remove('dbUtils', { value: '32' }),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(changes).toBe(1)
    })
  })
})
