import { init } from '../init'
import { insert, remove, dbExec, dbGet, update } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { User } from '../user/interface'
import { getFakeUser } from '../test/getFakeUser'
import { pipe } from 'fp-ts/function'
import { either, option, taskEither } from 'fp-ts'
import { registerUser } from '../test/registerUser'
import { getFakeClient } from '../test/getFakeClient'
import {
  ClientCreationInput,
  ClientUpdateInput,
  DatabaseClient
} from './interface'
import { testError, testTaskEither } from '../test/util'
import { NonEmptyString } from 'io-ts-types'
import { sleep } from '../test/sleep'
import { unsafeNonEmptyString } from '../misc/Types'

describe('initClient', () => {
  describe('happy path', () => {
    let user: User

    beforeAll(async () => {
      process.env.SECRET = 'shhhhh'

      await init()()
      const result = await registerUser(getFakeUser())()

      expect(either.isRight(result)).toBe(true)

      pipe(
        result,
        either.fold(console.log, u => {
          user = u
        })
      )
    })

    afterAll(async () => {
      await remove('user')()
    })

    it('should create a database table', async () => {
      await dbExec(SQL`SELECT * FROM client`)()
    })

    it('should save the creation time automatically', async () => {
      const result = await pipe(
        insert('client', getFakeClient(user.id), ClientCreationInput),
        taskEither.chain(lastID =>
          dbGet(SQL`SELECT * FROM client WHERE id = ${lastID}`, DatabaseClient)
        ),
        taskEither.chain(taskEither.fromOption(testError))
      )()

      expect(either.isRight(result)).toBe(true)

      pipe(
        result,
        either.fold(console.log, client => {
          expect(DatabaseClient.is(client)).toBe(true)
          expect(client.created_at).toBeInstanceOf(Date)
        })
      )
    })

    it('should keep track of the time of the last update', async () => {
      const result = await pipe(
        insert('client', getFakeClient(user.id), ClientCreationInput),
        taskEither.chain(lastID =>
          dbGet(SQL`SELECT * FROM client WHERE id = ${lastID}`, DatabaseClient)
        ),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(client => taskEither.fromTask(sleep(1000, client))),
        taskEither.chain(client =>
          pipe(
            update(
              'client',
              client.id,
              { address_city: unsafeNonEmptyString('Milan') },
              ClientUpdateInput
            ),
            taskEither.chain(() =>
              dbGet(
                SQL`SELECT * FROM client WHERE id = ${client.id}`,
                DatabaseClient
              )
            ),
            taskEither.chain(taskEither.fromOption(testError)),
            taskEither.map(updatedClient => ({
              before: client.updated_at,
              after: updatedClient.updated_at
            }))
          )
        )
      )()

      expect(either.isRight(result)).toBe(true)

      pipe(
        result,
        either.fold(console.log, ({ before, after }) => {
          expect(before.getTime()).not.toBe(after.getTime())
        })
      )
    })

    it("should delete all user's clients when the user is deleted", async () => {
      await pipe(
        registerUser(getFakeUser(), user),
        taskEither.chain(user =>
          pipe(
            insert('client', getFakeClient(user.id), ClientCreationInput),
            taskEither.chain(lastID =>
              dbGet(
                SQL`SELECT * FROM client WHERE id = ${lastID}`,
                DatabaseClient
              )
            ),
            taskEither.chain(taskEither.fromOption(testError)),
            taskEither.chain(client =>
              pipe(
                remove('user', { id: user.id }),
                taskEither.chain(() =>
                  dbGet(
                    SQL`SELECT * FROM client WHERE id = ${client.id}`,
                    DatabaseClient
                  )
                )
              )
            )
          )
        ),
        testTaskEither(result => {
          expect(option.isNone(result)).toBe(true)
        })
      )
    })
  })
})
