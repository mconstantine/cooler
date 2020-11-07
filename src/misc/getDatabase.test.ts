jest.mock('sqlite')

import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { Database, ISqlite, open } from 'sqlite'
import { getDatabase } from './getDatabase'

const { open: actualOpen } = jest.requireActual('sqlite')

;(open as jest.Mock).mockImplementation((config: ISqlite.Config) =>
  actualOpen(config)
)

describe('getDatabase', () => {
  it('should cache the database', async () => {
    await getDatabase()()
    expect(open).toHaveBeenCalledTimes(1)

    await getDatabase()()
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('should return a working database', () => {
    expect.assertions(1)

    const createTable = (db: Database): TaskEither<Error, void> => {
      return taskEither.tryCatch(
        () => {
          return db.exec(SQL`
            CREATE TABLE IF NOT EXISTS tmp (
              id INTEGER PRIMARY KEY,
              key TEXT NOT NULL,
              value TEXT NOT NULL
            )
          `)
        },
        error => {
          console.log(error)
          return new Error('Unable to create table')
        }
      )
    }

    const testQuery = (db: Database): TaskEither<Error, []> => {
      return taskEither.tryCatch(
        () => {
          return db.all<[]>(SQL`SELECT * FROM tmp`)
        },
        error => {
          console.log(error)
          return new Error('Unable to query database')
        }
      )
    }

    return pipe(
      getDatabase(),
      taskEither.chain(db =>
        pipe(
          createTable(db),
          taskEither.chain(() => testQuery(db)),
          taskEither.map(test => expect(test).toEqual([]))
        )
      ),
      taskEither.getOrElse(error => {
        throw error
      })
    )()
  })
})
