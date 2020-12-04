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
import * as t from 'io-ts'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import { coolerError, EmptyObject } from '../misc/Types'

const CreateUserMutationInput = t.type(
  {
    user: UserCreationInput
  },
  'CreateUserMutationInput'
)
type CreateUserMutationInput = t.TypeOf<typeof CreateUserMutationInput>
const createUserMutation = createResolver(
  CreateUserMutationInput,
  AccessTokenResponse,
  (_parent, { user }, context) => createUser(user, context)
)

const LoginUserMutationInput = t.type(
  {
    user: UserLoginInput
  },
  'LoginUserMutationInput'
)
type LoginUserMutationInput = t.TypeOf<typeof LoginUserMutationInput>
const loginUserMutation = createResolver(
  LoginUserMutationInput,
  AccessTokenResponse,
  (_parent, { user }) => loginUser(user)
)

const refreshTokenMutation = createResolver(
  RefreshTokenInput,
  AccessTokenResponse,
  (_parent, args) => refreshToken(args)
)

const UpdateMeMutationInput = t.type(
  {
    user: UserUpdateInput
  },
  'UpdateMeMutationInput'
)
type UpdateMeMutationInput = t.TypeOf<typeof UpdateMeMutationInput>
const updateMeMutation = createResolver(
  UpdateMeMutationInput,
  User,
  (_parent, { user }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(contextUser => updateUser(contextUser.id, user))
    )
)

const deleteMeMutation = createResolver(
  EmptyObject,
  User,
  (_parent, _args, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteUser(user.id))
    )
)

const meQuery = createResolver(EmptyObject, User, (_parent, _args, context) =>
  pipe(
    getUserFromContext(context),
    taskEither.fromOption(() => coolerError('COOLER_403', 'Unauthorized'))
  )
)

const resolvers = {
  Mutation: {
    createUser: createUserMutation,
    loginUser: loginUserMutation,
    refreshToken: refreshTokenMutation,
    updateMe: updateMeMutation,
    deleteMe: deleteMeMutation
  },
  Query: {
    me: meQuery
  }
}

export default resolvers
