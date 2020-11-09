import { GraphQLFieldResolver } from 'graphql'
import {
  Context,
  UserCreationInput,
  UserLoginInput,
  RefreshTokenInput,
  UserUpdateInput
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
import { option, taskEither } from 'fp-ts'
import { coolerError, EmptyObject } from '../misc/Types'

const CreateUserMutationInput = t.type(
  {
    user: UserCreationInput
  },
  'CreateUserMutationInput'
)
type CreateUserMutationInput = t.TypeOf<typeof CreateUserMutationInput>
type CreateUserMutation = GraphQLFieldResolver<
  any,
  Context,
  CreateUserMutationInput
>
const createUserMutation: CreateUserMutation = createResolver(
  CreateUserMutationInput,
  (_parent, { user }, context) => createUser(user, context)
)

const LoginUserMutationInput = t.type(
  {
    user: UserLoginInput
  },
  'LoginUserMutationInput'
)
type LoginUserMutationInput = t.TypeOf<typeof LoginUserMutationInput>
type LoginUserMutation = GraphQLFieldResolver<any, any, LoginUserMutationInput>
const loginUserMutation: LoginUserMutation = createResolver(
  LoginUserMutationInput,
  (_parent, { user }) => loginUser(user)
)

type RefreshTokenMutation = GraphQLFieldResolver<any, any, RefreshTokenInput>
const refreshTokenMutation: RefreshTokenMutation = createResolver(
  RefreshTokenInput,
  (_parent, args) => refreshToken(args)
)

const UpdateMeMutationInput = t.type(
  {
    user: UserUpdateInput
  },
  'UpdateMeMutationInput'
)
type UpdateMeMutationInput = t.TypeOf<typeof UpdateMeMutationInput>
type UpdateMeMutation = GraphQLFieldResolver<
  any,
  Context,
  UpdateMeMutationInput
>
const updateMeMutation: UpdateMeMutation = createResolver(
  UpdateMeMutationInput,
  (_parent, { user }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(contextUser => updateUser(contextUser.id, user)),
      taskEither.map(option.toNullable)
    )
)

type DeleteMeMutation = GraphQLFieldResolver<any, Context, EmptyObject>
const deleteMeMutation: DeleteMeMutation = createResolver(
  EmptyObject,
  (_parent, _args, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteUser(user.id)),
      taskEither.map(option.toNullable)
    )
)

type MeQuery = GraphQLFieldResolver<any, Context, EmptyObject>
const meQuery: MeQuery = createResolver(
  EmptyObject,
  (_parent, _args, context) =>
    pipe(
      getUserFromContext(context),
      taskEither.fromOption(() => coolerError('COOLER_403', 'Unauthorized'))
    )
)

interface UserResolvers {
  Mutation: {
    createUser: CreateUserMutation
    loginUser: LoginUserMutation
    refreshToken: RefreshTokenMutation
    updateMe: UpdateMeMutation
    deleteMe: DeleteMeMutation
  }
  Query: {
    me: MeQuery
  }
}

const resolvers: UserResolvers = {
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
