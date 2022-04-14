import {
  UserCreationInput,
  UserLoginInput,
  RefreshTokenInput,
  UserUpdateInput,
  AccessTokenResponse,
  User
} from './interface'
import {
  createUser,
  loginUser,
  refreshToken,
  updateUser,
  deleteUser,
  getUserFromContext
} from './model'
import { ensureUser } from '../misc/ensureUser'
import { createResolver } from '../misc/createResolver'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import { coolerError } from '../misc/Types'
import { a18n } from '../misc/a18n'
import { Resolvers } from '../assignResolvers'

const createUserResolver = createResolver(
  {
    body: UserCreationInput,
    output: AccessTokenResponse
  },
  ({ body }, context) => createUser(body, context)
)

const loginUserResolver = createResolver(
  {
    body: UserLoginInput,
    output: AccessTokenResponse
  },
  ({ body }) => loginUser(body)
)

const refreshTokenResolver = createResolver(
  {
    body: RefreshTokenInput,
    output: AccessTokenResponse
  },
  ({ body }) => refreshToken(body)
)

const updateProfileResolver = createResolver(
  {
    body: UserUpdateInput,
    output: User
  },
  ({ body }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(contextUser => updateUser(contextUser._id, body))
    )
)

const deleteProfileResolver = createResolver(
  {
    output: User
  },
  (_args, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteUser(user._id))
    )
)

const profileQueryResolver = createResolver(
  {
    output: User
  },
  (_args, context) =>
    pipe(
      getUserFromContext(context),
      taskEither.fromOption(() =>
        coolerError('COOLER_403', a18n`You cannot see this user`)
      )
    )
)

const resolvers: Resolvers = [
  {
    path: '/profile',
    POST: {
      '/': createUserResolver,
      '/login': loginUserResolver,
      '/refreshToken': refreshTokenResolver
    },
    PUT: {
      '/': updateProfileResolver
    },
    DELETE: {
      '/': deleteProfileResolver
    },
    GET: {
      '/': profileQueryResolver
    }
  }
]

export default resolvers
