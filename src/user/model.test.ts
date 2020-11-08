import { either, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { init } from '../init'
import { remove } from '../misc/dbUtils'
import { coolerError, EmailString } from '../misc/Types'
import { getFakeUser } from '../test/getFakeUser'
import { testError } from '../test/util'
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
      const token = await createUser(getFakeUser(), {})()

      expect(either.isRight(token)).toBe(true)

      pipe(
        token,
        either.fold(console.log, token =>
          expect(AccessTokenResponse.is(token)).toBe(true)
        )
      )
    })

    it('should encrypt password', async () => {
      const input = getFakeUser()

      const user = await pipe(
        createUser(input, {}),
        taskEither.chain(() => getUserByEmail(input.email)),
        taskEither.chain(taskEither.fromOption(testError))
      )()

      expect(either.isRight(user)).toBe(true)

      pipe(
        user,
        either.fold(console.log, user =>
          expect(user.password).not.toBe(input.password)
        )
      )
    })

    it("should not allow anonymous registration unless it's the first user ever", async () => {
      const input = getFakeUser()
      let token = await createUser(input, {})()

      expect(either.isRight(token)).toBe(true)

      const result = await createUser(getFakeUser(), {})()

      expect(either.isLeft(result)).toBe(true)

      pipe(
        result,
        either.fold(
          error => expect(error.extensions.code).toBe('COOLER_403'),
          console.log
        )
      )

      token = await pipe(
        getUserByEmail(input.email),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(user => createUser(getFakeUser(), { user }))
      )()

      expect(either.isRight(token)).toBe(true)

      pipe(
        token,
        either.fold(console.log, token =>
          expect(AccessTokenResponse.is(token)).toBe(true)
        )
      )
    })

    it('should keep emails unique', async () => {
      const input = getFakeUser()
      const token = await createUser(input, {})()

      expect(either.isRight(token)).toBe(true)

      const result = await pipe(
        getUserByEmail(input.email),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(user =>
          createUser(getFakeUser({ email: input.email }), { user })
        )
      )()

      expect(either.isLeft(result)).toBe(true)

      pipe(
        result,
        either.fold(
          error => expect(error.extensions.code).toBe('COOLER_409'),
          console.log
        )
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
      const token = await loginUser({
        email: user.email,
        password: user.password
      })()

      expect(either.isRight(token)).toBe(true)

      pipe(
        token,
        either.fold(console.log, token =>
          expect(AccessTokenResponse.is(token)).toBe(true)
        )
      )
    })

    it('should fail if email is wrong', async () => {
      const result = await loginUser({
        email: ('not-' + user.email) as EmailString,
        password: user.password
      })()

      expect(either.isLeft(result)).toBe(true)

      pipe(
        result,
        either.fold(
          error => expect(error.extensions.code).toBe('COOLER_404'),
          console.log
        )
      )
    })

    it('should fail if password is wrong', async () => {
      const result = await loginUser({
        email: user.email,
        password: (user.password + 'not') as NonEmptyString
      })()

      expect(either.isLeft(result)).toBe(true)

      pipe(
        result,
        either.fold(
          error => expect(error.extensions.code).toBe('COOLER_400'),
          console.log
        )
      )
    })
  })

  describe('refreskToken', () => {
    const user = getFakeUser()
    let response: AccessTokenResponse

    beforeAll(async () => {
      const result = await createUser(user, {})()

      expect(either.isRight(result)).toBe(true)

      pipe(
        result,
        either.fold(console.log, result => {
          response = result
        })
      )
    })

    afterAll(async () => {
      await remove('user')()
    })

    it('should work', async () => {
      const result = await refreshToken({
        refreshToken: response.refreshToken
      })()

      expect(either.isRight(result)).toBe(true)

      pipe(
        result,
        either.fold(console.log, token =>
          expect(AccessTokenResponse.is(token)).toBe(true)
        )
      )
    })

    it('should fail if token is invalid', async () => {
      const result = await refreshToken({
        refreshToken: 'fake' as NonEmptyString
      })()

      expect(either.isLeft(result)).toBe(true)

      pipe(
        result,
        either.fold(
          error => expect(error.extensions.code).toBe('COOLER_400'),
          console.log
        )
      )
    })

    it('should fail if token is of the wrong type', async () => {
      const result = await refreshToken({
        refreshToken: response.accessToken
      })()

      expect(either.isLeft(result)).toBe(true)

      pipe(
        result,
        either.fold(
          error => expect(error.extensions.code).toBe('COOLER_400'),
          console.log
        )
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
      const result = await pipe(
        getUserByEmail(user.email),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(user =>
          updateUser(user.id, {
            name: (user.name + ' Jr') as NonEmptyString
          })
        ),
        taskEither.chain(taskEither.fromOption(testError))
      )()

      expect(either.isRight(result)).toBe(true)

      pipe(
        result,
        either.fold(console.log, updatedUser => {
          expect(User.is(updatedUser)).toBe(true)
          expect(updatedUser.name).toBe(user.name + ' Jr')
        })
      )
    })

    it('should keep emails unique', async () => {
      const user2 = getFakeUser()

      const result = await pipe(
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
        )
      )()

      await remove('user', { email: user2.email })()
      expect(either.isLeft(result)).toBe(true)

      pipe(
        result,
        either.fold(
          error => expect(error.extensions.code).toBe('COOLER_409'),
          console.log
        )
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
      const result = await pipe(
        getUserByEmail(user.email),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(user => deleteUser(user.id)),
        taskEither.chain(() => getUserByEmail(user.email)),
        taskEither.chain(
          taskEither.fromOption(() =>
            coolerError('COOLER_404', 'This should happen')
          )
        )
      )()

      expect(either.isLeft(result)).toBe(true)

      pipe(
        result,
        either.fold(
          error => expect(error.message).toBe('This should happen'),
          console.log
        )
      )
    })
  })
})
