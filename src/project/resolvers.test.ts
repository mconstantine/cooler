import { option, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/lib/Apply'
import { insertClient } from '../client/database'
import { init } from '../init'
import { remove } from '../misc/dbUtils'
import { NonNegativeNumber } from '../misc/Types'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeUser } from '../test/getFakeUser'
import { registerUser } from '../test/registerUser'
import { testError, testTaskEither } from '../test/util'
import { getUserById } from '../user/database'
import { insertProject } from './database'
import resolvers from './resolvers'

describe('project resolvers', () => {
  beforeAll(async () => {
    process.env.SECRET = 'shhhhh'
    await pipe(init(), testTaskEither(constVoid))
  })

  afterAll(async () => {
    delete process.env.SECRET
    await pipe(remove('user'), testTaskEither(constVoid))
  })

  describe('User', () => {
    describe('cashedBalance', () => {
      it('should work', async () => {
        await pipe(
          registerUser(getFakeUser()),
          taskEither.chain(user =>
            pipe(
              insertClient(getFakeClient(user.id)),
              taskEither.chain(client =>
                sequenceS(taskEither.taskEither)({
                  p1: insertProject(
                    getFakeProject(client, {
                      cashed: option.some({
                        at: new Date(),
                        balance: 15 as NonNegativeNumber
                      })
                    })
                  ),
                  p2: insertProject(
                    getFakeProject(client, {
                      cashed: option.some({
                        at: new Date(),
                        balance: 25 as NonNegativeNumber
                      })
                    })
                  )
                })
              ),
              taskEither.chain(() => getUserById(user.id)),
              taskEither.chain(taskEither.fromOption(testError))
            )
          ),
          taskEither.chain(user =>
            taskEither.tryCatch(
              () => resolvers.User.cashedBalance(user, {}, {}),
              testError
            )
          ),
          testTaskEither(result => {
            expect(result).toBe(40)
          })
        )
      })
    })
  })
})
