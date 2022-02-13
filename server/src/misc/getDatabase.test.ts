jest.mock('sqlite')

import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { Database, ISqlite, open } from 'sqlite'
import { testTaskEither } from '../test/util'
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

  it('should return a working database', async () => {
    const createTable = (db: Database): TaskEither<Error, void> => {
      return taskEither.tryCatch(
        () => {
          return db.exec(SQL`
            CREATE TABLE IF NOT EXISTS getDatabase (
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
          return db.all<[]>(SQL`SELECT * FROM getDatabase`)
        },
        error => {
          console.log(error)
          return new Error('Unable to query database')
        }
      )
    }

    await pipe(
      getDatabase(),
      taskEither.mapLeft(() => new Error('Unable to access database')),
      taskEither.chain(db =>
        pipe(
          createTable(db),
          taskEither.chain(() => testQuery(db))
        )
      ),
      testTaskEither(test => expect(test).toEqual([]))
    )
  })
})
