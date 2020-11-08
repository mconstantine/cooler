import { init } from '../init'
import { getFakeUser } from '../test/getFakeUser'
import { dbExec } from '../misc/dbUtils'
import { DatabaseUser } from './interface'
import SQL from 'sql-template-strings'
import { constVoid, pipe } from 'fp-ts/function'
import { option, task, taskEither } from 'fp-ts'
import { getUserById, insertUser, updateUser } from './database'
import { Option } from 'fp-ts/Option'
import { testError } from '../test/util'
import { sleep } from '../test/sleep'
import { NonEmptyString } from 'io-ts-types'

describe('initUser', () => {
  describe('happy path', () => {
    beforeAll(async () => {
      await init()()
    })

    it('should create a database table', async () => {
      await dbExec(SQL`SELECT * FROM user`)()
    })

    it('should save the creation time automatically', async () => {
      const user = await pipe(
        insertUser(getFakeUser()),
        taskEither.chain(id => getUserById(id)),
        taskEither.getOrElse(() =>
          task.fromIO<Option<DatabaseUser>>(() => option.none)
        )
      )()

      expect(option.isSome(user)).toBe(true)

      pipe(
        user,
        option.fold(constVoid, user =>
          expect(user.created_at).toBeInstanceOf(Date)
        )
      )
    })

    it('should keep track of the time of the last update', async () => {
      interface Result {
        before: Date
        after: Date
      }

      const res = await pipe(
        getFakeUser(),
        insertUser,
        taskEither.chain(id => getUserById(id)),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(user => taskEither.fromTask(sleep(1000, user))),
        taskEither.chain(user =>
          pipe(
            updateUser(user.id, {
              name: (user.name + ' Jr') as NonEmptyString
            }),
            taskEither.chain(() => getUserById(user.id)),
            taskEither.chain(taskEither.fromOption(testError)),
            taskEither.map(updatedUser =>
              option.some({
                before: user.updated_at,
                after: updatedUser.updated_at
              })
            )
          )
        ),
        taskEither.getOrElse(() =>
          task.fromIO<Option<Result>>(() => option.none)
        )
      )()

      expect(option.isSome(res)).toBe(true)

      pipe(
        res,
        option.fold(constVoid, ({ before, after }) =>
          expect(before.getTime()).not.toBe(after.getTime())
        )
      )
    })
  })
})
