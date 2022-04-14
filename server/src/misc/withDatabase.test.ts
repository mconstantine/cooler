import { Db } from 'mongodb'
import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { testTaskEither, testTaskEitherError } from '../test/util'
import { withDatabase } from './withDatabase'
import { coolerError } from './Types'
import { unsafeLocalizedString } from './a18n'

describe('getDatabase', () => {
  it('should connect to the database', async () => {
    await pipe(
      withDatabase(taskEither.of),
      testTaskEither(db => expect(db).toBeInstanceOf(Db))
    )
  })

  it('should close the connection once finished', async () => {
    await pipe(
      withDatabase(taskEither.of),
      taskEither.chain(db =>
        taskEither.tryCatch(
          () => db.command({ connectionStatus: 1 }),
          error =>
            coolerError(
              'COOLER_500',
              unsafeLocalizedString('The database is disconnected as expected'),
              { error: (error as { name: string }).name }
            )
        )
      ),
      testTaskEitherError(error =>
        expect(error.extras.error).toBe('MongoNotConnectedError')
      )
    )
  })
})
