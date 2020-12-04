import { init } from './init'
import { remove } from './misc/dbUtils'
import { getFakeUser } from './test/getFakeUser'
import { getFakeClient } from './test/getFakeClient'
import { getFakeProject } from './test/getFakeProject'
import { DatabaseProject } from './project/interface'
import { constVoid, pipe } from 'fp-ts/function'
import { testError, testTaskEither } from './test/util'
import { registerUser } from './test/registerUser'
import { taskEither } from 'fp-ts'
import { insertClient } from './client/database'
import { getProjectById, insertProject } from './project/database'

describe('init', () => {
  beforeAll(async () => {
    process.env.SECRET = 'shhhhh'
    await pipe(init(), testTaskEither(constVoid))
  })

  afterAll(async () => {
    delete process.env.SECRET
    await pipe(remove('user'), testTaskEither(constVoid))
  })

  describe('migrations', () => {
    describe('project-cashed-balance', () => {
      it('should work', async () => {
        await pipe(
          registerUser(getFakeUser()),
          taskEither.chain(user => insertClient(getFakeClient(user.id))),
          taskEither.chain(clientId => insertProject(getFakeProject(clientId))),
          taskEither.chain(getProjectById),
          taskEither.chain(taskEither.fromOption(testError)),
          testTaskEither(project => {
            const encoded = DatabaseProject.encode(project)
            expect(encoded.cashed_balance).toBeDefined()
          })
        )
      })
    })
  })
})
