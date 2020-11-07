import { option, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import SQL from 'sql-template-strings'
import { dbExec, dbGet, dbGetAll, insert, remove, update } from './dbUtils'
import { PositiveInteger } from './Types'

interface Row {
  id: PositiveInteger
  key: string
  value: string
  optional?: string
}

interface RowInput extends Omit<Row, 'id'> {}

describe('dbUtils', () => {
  beforeAll(async () => {
    await dbExec(SQL`
      CREATE TABLE IF NOT EXISTS tmp (
        id INTEGER PRIMARY KEY,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        optional TEXT
      )
    `)()

    await dbExec(SQL`
      INSERT INTO tmp (
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
    await dbExec(SQL`DROP TABLE tmp`)()
  })

  describe('dbGet', () => {
    it('should work', async () => {
      const row = await pipe(
        dbGet<Row>(SQL`SELECT * FROM tmp WHERE key = "one"`),
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
        dbGetAll<Row>(SQL`SELECT * FROM tmp`),
        taskEither.getOrElse(() => task.fromIO(() => [] as Row[]))
      )()

      expect(rows.length).toBeGreaterThan(0)
    })
  })

  describe('insert and remove', () => {
    it('should work', async () => {
      const data: RowInput = {
        key: 'seven',
        value: '7'
      }

      const lastID = await pipe(
        insert('tmp', data),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(typeof lastID).toBe('number')
      expect(lastID).toBeGreaterThan(0)

      const changes = await pipe(
        remove('tmp', { id: lastID }),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(changes).toBe(1)
    })

    it('should handle multiple rows', async () => {
      const data: RowInput[] = [
        {
          key: 'sixty',
          value: '42'
        },
        {
          key: 'eighty',
          value: '42'
        }
      ]

      await insert('tmp', data)()

      const changes = await pipe(
        remove('tmp', { value: '42' }),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(changes).toBe(2)
    })

    it('should remove keys with undefined value', async () => {
      const data: RowInput[] = [
        {
          key: 'twenty',
          value: '20',
          optional: undefined
        },
        {
          key: 'twentyone',
          value: '20',
          optional: undefined
        }
      ]

      await insert('tmp', data)()

      const rows = await pipe(
        dbGetAll<Row>(SQL`SELECT * FROM tmp WHERE value = "20"`),
        taskEither.getOrElse(() => task.fromIO(() => [] as Row[]))
      )()

      expect(rows.length).toBe(2)
      expect(rows).toContainEqual(expect.objectContaining({ optional: null }))

      const changes = await pipe(
        remove('tmp', { value: '20' }),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(changes).toBe(2)
    })
  })

  describe('update', () => {
    it('should work', async () => {
      const data: RowInput = {
        key: 'thirty',
        value: '30'
      }

      const lastID = await pipe(
        insert('tmp', data),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(lastID).toBeGreaterThan(0)

      let changes = await pipe(
        update('tmp', { key: 'thirty', value: '32' }, 'key'),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(changes).toBe(1)

      const result = await pipe(
        dbGet<Row>(SQL`SELECT * FROM tmp WHERE id = ${lastID}`),
        taskEither.getOrElse(() =>
          task.fromIO(() => option.none as Option<Row>)
        )
      )()

      expect(option.isSome(result)).toBe(true)
      expect((result as option.Some<Row>).value.value).toBe('32')

      changes = await pipe(
        remove('tmp', { value: '32' }),
        taskEither.getOrElse(() => task.fromIO(() => 0))
      )()

      expect(changes).toBe(1)
    })
  })
})
