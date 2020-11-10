import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { init } from '../init'
import { remove } from '../misc/dbUtils'
import { coolerError, EmailString } from '../misc/Types'
import { getFakeUser } from '../test/getFakeUser'
import {
  pipeTestTaskEither,
  pipeTestTaskEitherError,
  testError,
  testTaskEither,
  testTaskEitherError
} from '../test/util'
import { getUserByEmail } from './database'
import { AccessTokenResponse, User } from './interface'
import {
  createUser,
  deleteUser,
  loginUser,
  refreshToken,
  updateUser
} from './model'

describe('userModel', () => {
  beforeAll(async () => {
    process.env.SECRET = 'shhhhh'
    await init()()
  })

  afterAll(() => {
    delete process.env.SECRET
  })

  describe('createUser', () => {
    afterEach(async () => {
      await remove('user')()
    })

    it('should work', async () => {
      await pipe(
        createUser(getFakeUser(), {}),
        testTaskEither(token => {
          expect(AccessTokenResponse.is(token)).toBe(true)
        })
      )
    })

    it('should encrypt password', async () => {
      const input = getFakeUser()

      await pipe(
        createUser(input, {}),
        taskEither.chain(() => getUserByEmail(input.email)),
        taskEither.chain(taskEither.fromOption(testError)),
        testTaskEither(user => {
          expect(user.password).not.toBe(input.password)
        })
      )
    })

    it("should not allow anonymous registration unless it's the first user ever", async () => {
      const input = getFakeUser()

      await pipe(
        createUser(input, {}),
        taskEither.chain(() => createUser(getFakeUser(), {})),
        testTaskEitherError(error => {
          expect(error.extensions.code).toBe('COOLER_403')
        })
      )

      await pipe(
        getUserByEmail(input.email),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(user => createUser(getFakeUser(), { user })),
        testTaskEither(token => {
          expect(AccessTokenResponse.is(token)).toBe(true)
        })
      )
    })

    it('should keep emails unique', async () => {
      const input = getFakeUser()

      await pipe(
        createUser(input, {}),
        taskEither.chain(() => getUserByEmail(input.email)),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(user =>
          createUser(getFakeUser({ email: input.email }), { user })
        ),
        testTaskEitherError(error => {
          expect(error.extensions.code).toBe('COOLER_409')
        })
      )
    })
  })

  describe('loginUser', () => {
    const user = getFakeUser()

    beforeAll(async () => {
      await createUser(user, {})()
    })

    afterAll(async () => {
      await remove('user', { email: user.email })()
    })

    it('should work', async () => {
      await pipe(
        loginUser({
          email: user.email,
          password: user.password
        }),
        testTaskEither(token => {
          expect(AccessTokenResponse.is(token)).toBe(true)
        })
      )
    })

    it('should fail if email is wrong', async () => {
      await pipe(
        loginUser({
          email: ('not-' + user.email) as EmailString,
          password: user.password
        }),
        testTaskEitherError(error => {
          expect(error.extensions.code).toBe('COOLER_404')
        })
      )
    })

    it('should fail if password is wrong', async () => {
      await pipe(
        loginUser({
          email: user.email,
          password: (user.password + 'not') as NonEmptyString
        }),
        testTaskEitherError(error => {
          expect(error.extensions.code).toBe('COOLER_400')
        })
      )
    })
  })

  describe('refreskToken', () => {
    const user = getFakeUser()
    let response: AccessTokenResponse

    beforeAll(async () => {
      await pipe(
        createUser(user, {}),
        testTaskEither(result => {
          response = result
        })
      )
    })

    afterAll(async () => {
      await remove('user')()
    })

    it('should work', async () => {
      await pipe(
        refreshToken({
          refreshToken: response.refreshToken
        }),
        testTaskEither(token => {
          expect(AccessTokenResponse.is(token)).toBe(true)
        })
      )
    })

    it('should fail if token is invalid', async () => {
      await pipe(
        refreshToken({
          refreshToken: 'fake' as NonEmptyString
        }),
        testTaskEitherError(error => {
          expect(error.extensions.code).toBe('COOLER_400')
        })
      )
    })

    it('should fail if token is of the wrong type', async () => {
      await pipe(
        refreshToken({
          refreshToken: response.accessToken
        }),
        testTaskEitherError(error => {
          expect(error.extensions.code).toBe('COOLER_400')
        })
      )
    })
  })

  describe('updateUser', () => {
    const user = getFakeUser()

    beforeAll(async () => {
      await createUser(user, {})()
    })

    afterAll(async () => {
      await remove('user', { email: user.email })()
    })

    it('should work', async () => {
      await pipe(
        getUserByEmail(user.email),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(user =>
          updateUser(user.id, {
            name: (user.name + ' Jr') as NonEmptyString
          })
        ),
        testTaskEither(updatedUser => {
          expect(User.is(updatedUser)).toBe(true)
          expect(updatedUser.name).toBe(user.name + ' Jr')
        })
      )
    })

    it('should keep emails unique', async () => {
      const user2 = getFakeUser()

      await pipe(
        getUserByEmail(user.email),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(user =>
          pipe(
            createUser(user2, { user }),
            taskEither.chain(() =>
              updateUser(user.id, {
                email: user2.email
              })
            )
          )
        ),
        pipeTestTaskEitherError(error => {
          expect(error.extensions.code).toBe('COOLER_409')
        }),
        taskEither.chain(() => remove('user', { email: user2.email }))
      )
    })
  })

  describe('deleteUser', () => {
    const user = getFakeUser()

    beforeAll(async () => {
      await createUser(user, {})()
    })

    afterAll(async () => {
      await remove('user', {})()
    })

    it('should work', async () => {
      await pipe(
        getUserByEmail(user.email),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(user => deleteUser(user.id)),
        pipeTestTaskEither(deletedUser => {
          expect(deletedUser.email).toBe(user.email)
        }),
        taskEither.chain(() => getUserByEmail(user.email)),
        taskEither.chain(
          taskEither.fromOption(() =>
            coolerError('COOLER_404', 'This should happen')
          )
        ),
        testTaskEitherError(error => {
          expect(error.message).toBe('This should happen')
        })
      )
    })
  })
})
