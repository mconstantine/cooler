import { constVoid, identity, pipe } from 'fp-ts/function'
import { pipeTestTaskEither, testTaskEither } from '../test/util'
import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import { getFakeUser } from '../test/getFakeUser'
import { AccessTokenResponse, User } from '../user/interface'
import { loginUser, mutate, query } from './graphQLUtils'
import * as t from 'io-ts'
import { startServerAndGetClient, stopServer } from './setupTests'
import { remove } from '../misc/dbUtils'
import { registerUser } from '../test/registerUser'
import { taskEither } from 'fp-ts'
import { sleep } from '../test/sleep'

const userFragment = gql`
  fragment User on User {
    id
    name
    email
    password
    created_at
    updated_at
  }
`

const tokenFragment = gql`
  fragment TokenResponse on TokenResponse {
    accessToken
    refreshToken
    expiration
  }
`

describe('user resolvers', () => {
  let client: ApolloClient<NormalizedCacheObject>

  beforeAll(async () => {
    client = await pipe(startServerAndGetClient(), testTaskEither(identity))
  })

  afterAll(async () => {
    await pipe(stopServer(), testTaskEither(constVoid))
  })

  describe('registration', () => {
    afterAll(async () => {
      await pipe(remove('user'), testTaskEither(constVoid))
    })

    it('should work', async () => {
      const data = getFakeUser()

      await pipe(
        mutate(
          t.type({
            createUser: AccessTokenResponse
          }),
          client,
          gql`
            ${tokenFragment}

            mutation {
              createUser(user: {
                name: "${data.name}"
                email: "${data.email}"
                password: "${data.password}"
              }) {
                ...TokenResponse
              }
            }
          `
        ),
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
        loginUser(client, user.email, user.password),
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
        loginUser(client, user.email, user.password),
        taskEither.chain(({ accessToken }) =>
          mutate(
            t.type({
              updateMe: User
            }),
            client,
            gql`
              ${userFragment}

              mutation {
                updateMe(user: {
                  name: "${data.name}",
                  email: "${data.email}",
                  password: "${data.password}"
                }) {
                  ...User
                }
              }
            `,
            accessToken
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
        loginUser(client, user.email, user.password),
        taskEither.chain(({ accessToken }) =>
          mutate(
            t.type({
              deleteMe: User
            }),
            client,
            gql`
              ${userFragment}

              mutation {
                deleteMe {
                  ...User
                }
              }
            `,
            accessToken
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
        loginUser(client, user.email, user.password),
        taskEither.chain(res => taskEither.fromTask(sleep(1000, res))),
        taskEither.chain(({ accessToken, refreshToken }) =>
          pipe(
            mutate(
              t.type({
                refreshToken: AccessTokenResponse
              }),
              client,
              gql`
                ${tokenFragment}

                mutation {
                  refreshToken(refreshToken: "${refreshToken}") {
                    ...TokenResponse
                  }
                }
              `
            ),
            pipeTestTaskEither(result => {
              expect(result.refreshToken.refreshToken).toBe(refreshToken)
              expect(result.refreshToken.accessToken).not.toBe(accessToken)
            })
          )
        ),
        testTaskEither(constVoid)
      )
    })
  })

  describe('me', () => {
    const user = getFakeUser()

    beforeAll(async () => {
      await pipe(registerUser(user), testTaskEither(constVoid))
    })

    afterAll(async () => {
      await pipe(remove('user'), testTaskEither(constVoid))
    })

    it('should work', async () => {
      await pipe(
        loginUser(client, user.email, user.password),
        taskEither.chain(({ accessToken }) =>
          query(
            t.type({
              me: User
            }),
            client,
            gql`
              ${userFragment}

              query {
                me {
                  ...User
                }
              }
            `,
            accessToken
          )
        ),
        testTaskEither(constVoid)
      )
    })
  })
})
