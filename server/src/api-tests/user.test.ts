import { constVoid, pipe } from 'fp-ts/function'
import { testTaskEither } from '../test/util'
import { getFakeUser } from '../test/getFakeUser'
import { remove } from '../misc/dbUtils'
import { registerUser } from '../test/registerUser'
import { taskEither } from 'fp-ts'
import { TaskEither } from 'fp-ts/TaskEither'
import { setupTests } from './setupTests'
import axios from 'axios'
import { API_URL, loginUser, testRequest } from './utils'
import { AccessTokenResponse, User } from '../user/interface'

describe('user resolvers', () => {
  let stopServer: TaskEither<Error, void>

  beforeAll(async () => {
    stopServer = await setupTests()
  })

  afterAll(async () => {
    await pipe(stopServer, testTaskEither(constVoid))
  })

  describe('registration', () => {
    afterAll(async () => {
      await pipe(remove('user'), testTaskEither(constVoid))
    })

    it('should work', async () => {
      const data = getFakeUser()

      await pipe(
        axios.post(`${API_URL}/profile`, {
          name: data.name,
          email: data.email,
          password: data.password
        }),
        testRequest(AccessTokenResponse),
        testTaskEither(constVoid)
      )
    })
  })

  describe('login', () => {
    const user = getFakeUser()

    beforeAll(async () => {
      await pipe(registerUser(user), testTaskEither(constVoid))
    })

    afterAll(async () => {
      await pipe(remove('user'), testTaskEither(constVoid))
    })

    it('should work', async () => {
      await pipe(
        axios.post(`${API_URL}/profile/login`, {
          email: user.email,
          password: user.password
        }),
        testRequest(AccessTokenResponse),
        testTaskEither(constVoid)
      )
    })
  })

  describe('updateMe', () => {
    const user = getFakeUser()

    beforeAll(async () => {
      await pipe(registerUser(user), testTaskEither(constVoid))
    })

    afterAll(async () => {
      await pipe(remove('user'), testTaskEither(constVoid))
    })

    it('should work', async () => {
      const data = getFakeUser()

      await pipe(
        loginUser(user.email, user.password),
        taskEither.chain(({ accessToken }) =>
          pipe(
            axios.put(`${API_URL}/profile`, data, {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            }),
            testRequest(User)
          )
        ),
        testTaskEither(constVoid)
      )
    })
  })

  describe('deleteMe', () => {
    const user = getFakeUser()

    beforeAll(async () => {
      await pipe(registerUser(user), testTaskEither(constVoid))
    })

    afterAll(async () => {
      await pipe(remove('user'), testTaskEither(constVoid))
    })

    it('should work', async () => {
      await pipe(
        loginUser(user.email, user.password),
        taskEither.chain(({ accessToken }) =>
          pipe(
            axios.delete(`${API_URL}/profile`, {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            }),
            testRequest(User)
          )
        ),
        testTaskEither(constVoid)
      )
    })
  })

  describe('refeshToken', () => {
    const user = getFakeUser()

    beforeAll(async () => {
      await pipe(registerUser(user), testTaskEither(constVoid))
    })

    afterAll(async () => {
      await pipe(remove('user'), testTaskEither(constVoid))
    })

    it('should work', async () => {
      await pipe(
        loginUser(user.email, user.password),
        taskEither.chain(({ accessToken, refreshToken }) =>
          pipe(
            axios.post(
              `${API_URL}/profile/refreshToken`,
              { refreshToken },
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
              }
            ),
            testRequest(AccessTokenResponse)
          )
        ),
        testTaskEither(constVoid)
      )
    })
  })

  describe('getProfile', () => {
    const user = getFakeUser()

    beforeAll(async () => {
      await pipe(registerUser(user), testTaskEither(constVoid))
    })

    afterAll(async () => {
      await pipe(remove('user'), testTaskEither(constVoid))
    })

    it('should work', async () => {
      await pipe(
        loginUser(user.email, user.password),
        taskEither.chain(({ accessToken }) =>
          pipe(
            axios.get(`${API_URL}/profile`, {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            }),
            testRequest(User)
          )
        ),
        testTaskEither(constVoid)
      )
    })
  })
})
