import SQL from 'sql-template-strings'
import { init } from '../init'
import { dbExec, dbGet, insert, remove } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeTax } from '../test/getFakeTax'
import { constVoid, pipe } from 'fp-ts/function'
import { pipeTestTaskEither, testError, testTaskEither } from '../test/util'
import { User } from '../user/interface'
import { option, taskEither } from 'fp-ts'
import { registerUser } from '../test/registerUser'
import { Tax, TaxCreationInput } from './interface'
import { deleteUser } from '../user/database'

describe('init taxes', () => {
  let user: User

  beforeAll(async () => {
    process.env.SECRET = 'shhhhh'

    await pipe(
      init(),
      taskEither.chain(() => registerUser(getFakeUser())),
      pipeTestTaskEither(u => {
        user = u
      }),
      testTaskEither(constVoid)
    )
  })

  afterAll(async () => {
    delete process.env.SECRET
    await pipe(remove('user'), testTaskEither(constVoid))
  })

  it('should create a database table', async () => {
    await pipe(dbExec(SQL`SELECT * FROM tax`), testTaskEither(constVoid))
  })

  it('should delete taxes if a user is deleted', async () => {
    await pipe(
      registerUser(getFakeUser(), user),
      taskEither.chain(user =>
        pipe(
          insert('tax', getFakeTax(user.id), TaxCreationInput),
          taskEither.chain(taxId =>
            pipe(
              dbGet(SQL`SELECT * FROM tax WHERE id = ${taxId}`, Tax),
              taskEither.chain(taskEither.fromOption(testError)),
              taskEither.chain(() => deleteUser(user.id)),
              taskEither.chain(() =>
                dbGet(SQL`SELECT * FROM tax WHERE id = ${taxId}`, Tax)
              )
            )
          )
        )
      ),
      testTaskEither(tax => {
        expect(option.isNone(tax)).toBe(true)
      })
    )
  })
})
