import { init } from '../init'
import { getFakeUser } from '../test/getFakeUser'
import { dbExec } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import { getUserById, insertUser, updateUser } from './database'
import { testError, testTaskEither } from '../test/util'
import { sleep } from '../test/sleep'
import { unsafeNonEmptyString } from '../misc/Types'

describe('initUser', () => {
  describe('happy path', () => {
    beforeAll(async () => {
      await init()()
    })

    it('should create a database table', async () => {
      await dbExec(SQL`SELECT * FROM user`)()
    })

    it('should save the creation time automatically', async () => {
      await pipe(
        insertUser(getFakeUser()),
        taskEither.chain(id => getUserById(id)),
        taskEither.chain(taskEither.fromOption(testError)),
        testTaskEither(user => {
          expect(user.created_at).toBeInstanceOf(Date)
        })
      )
    })

    it('should keep track of the time of the last update', async () => {
      await pipe(
        getFakeUser(),
        insertUser,
        taskEither.chain(id => getUserById(id)),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(user => taskEither.fromTask(sleep(1000, user))),
        taskEither.chain(user =>
          pipe(
            updateUser(user.id, {
              name: unsafeNonEmptyString(user.name + ' Jr')
            }),
            taskEither.chain(() => getUserById(user.id)),
            taskEither.chain(taskEither.fromOption(testError)),
            taskEither.map(updatedUser => ({
              before: user.updated_at,
              after: updatedUser.updated_at
            }))
          )
        ),
        testTaskEither(({ before, after }) => {
          expect(before.getTime()).not.toBe(after.getTime())
        })
      )
    })
  })
})
