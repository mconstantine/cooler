import * as t from 'io-ts'
import {
  AccessTokenResponse,
  RefreshTokenInput,
  User,
  userCollection,
  UserCreationInput,
  UserLoginInput,
  UserUpdateInput
} from './interface'
import { constVoid, identity, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { withCollection } from '../misc/withDatabase'
import { startServer } from '../startServer'
import { getFakeUser } from '../test/getFakeUser'
import { testTaskEither, testTaskEitherError } from '../test/util'
import { taskEither } from 'fp-ts'
import { coolerError, unsafeNonEmptyString } from '../misc/Types'
import { unsafeLocalizedString } from '../misc/a18n'
import {
  makeDeleteRequest,
  makeGetRequest,
  makePostRequest,
  makePutRequest,
  sendRequest
} from '../test/api'
import faker from 'faker'

describe('user API', () => {
  let stopServer: TaskEither<Error, void>

  beforeAll(async () =>
    pipe(
      startServer(),
      testTaskEither(stopCommand => {
        stopServer = stopCommand
      })
    )
  )

  afterAll(
    async () =>
      await pipe(
        withCollection(userCollection, collection =>
          taskEither.tryCatch(
            () => collection.deleteMany({}),
            () =>
              coolerError(
                'COOLER_500',
                unsafeLocalizedString(
                  'failed to empty users collection after test'
                )
              )
          )
        ),
        taskEither.mapLeft(error => new Error(error.message)),
        taskEither.chain(() => stopServer),
        testTaskEither(constVoid)
      )
  )

  it('should work', async () => {
    const admin = getFakeUser()

    const adminRegistrationRequest = makePostRequest({
      path: '/profile',
      input: admin,
      inputCodec: UserCreationInput,
      outputCodec: AccessTokenResponse
    })

    const adminRegistrationResponse = await pipe(
      sendRequest(adminRegistrationRequest),
      testTaskEither(identity)
    )

    const user = getFakeUser()

    const userCreationRequest = makePostRequest({
      path: '/profile',
      input: user,
      inputCodec: UserCreationInput,
      outputCodec: AccessTokenResponse
    })

    await pipe(
      sendRequest(userCreationRequest, adminRegistrationResponse),
      testTaskEither(constVoid)
    )

    const userLoginRequest = makePostRequest({
      path: '/profile/login',
      inputCodec: UserLoginInput,
      outputCodec: AccessTokenResponse,
      input: {
        email: user.email,
        password: user.password
      }
    })

    const userLoginResponse = await pipe(
      sendRequest(userLoginRequest),
      testTaskEither(identity)
    )

    const refreshTokenRequest = makePostRequest({
      path: '/profile/refreshToken',
      inputCodec: RefreshTokenInput,
      input: {
        refreshToken: userLoginResponse.refreshToken
      },
      outputCodec: AccessTokenResponse
    })

    await pipe(sendRequest(refreshTokenRequest), testTaskEither(constVoid))

    const userProfileRequest = makeGetRequest({
      path: '/profile',
      inputCodec: t.void,
      outputCodec: User
    })

    const userProfileResponse = await pipe(
      sendRequest(userProfileRequest, userLoginResponse),
      testTaskEither(identity)
    )

    let newName = user.name

    while (newName === user.name) {
      newName = unsafeNonEmptyString(
        `${faker.name.firstName()} ${faker.name.lastName()}`
      )
    }

    const updateProfileRequest = makePutRequest({
      path: '/profile',
      inputCodec: UserUpdateInput,
      input: { name: newName },
      outputCodec: User
    })

    const profileUpdateResponse = await pipe(
      sendRequest(updateProfileRequest, userLoginResponse),
      testTaskEither(identity)
    )

    expect(userProfileResponse.name).not.toBe(profileUpdateResponse.name)

    expect(userProfileResponse.createdAt.getTime()).toBe(
      profileUpdateResponse.createdAt.getTime()
    )

    expect(userProfileResponse.updatedAt.getTime()).not.toBe(
      profileUpdateResponse.updatedAt.getTime()
    )

    const deleteProfileRequest = makeDeleteRequest({
      path: '/profile',
      inputCodec: t.void,
      outputCodec: User
    })

    await pipe(
      sendRequest(deleteProfileRequest, userLoginResponse),
      testTaskEither(constVoid)
    )

    await pipe(
      sendRequest(userProfileRequest, userLoginResponse),
      testTaskEitherError(error => expect(error.code).toBe('COOLER_403'))
    )
  })
})
