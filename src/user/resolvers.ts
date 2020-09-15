import { GraphQLFieldResolver } from 'graphql'
import {
  AccessTokenResponse,
  Context,
  User,
  UserCreationInput,
  UserLoginInput,
  RefreshTokenInput,
  UserUpdateInput,
  UserContext
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

type CreateUserMutation = GraphQLFieldResolver<
  any,
  Context,
  { user: UserCreationInput }
>

const createUserMutation: CreateUserMutation = (
  _parent,
  { user: { name, email, password } },
  context
): Promise<AccessTokenResponse | null> => {
  return createUser(
    {
      name: name,
      email: email,
      password: password
    },
    context
  )
}

type LoginUserMutation = GraphQLFieldResolver<
  any,
  any,
  { user: UserLoginInput }
>

const loginUserMutation: LoginUserMutation = (
  _parent,
  { user }
): Promise<AccessTokenResponse> => {
  return loginUser(user)
}

export type RefreshTokenMutation = GraphQLFieldResolver<
  any,
  any,
  RefreshTokenInput
>

export const refreshTokenMutation: RefreshTokenMutation = (
  _parent,
  args
): Promise<AccessTokenResponse> => {
  return refreshToken(args)
}

export type UpdateMeMutation = GraphQLFieldResolver<
  any,
  Context,
  { user: UserUpdateInput }
>

export const updateMeMutation: UpdateMeMutation = (
  _parent,
  { user },
  context
): Promise<User | null> => {
  return updateUser(ensureUser(context).id, user)
}

export type DeleteMeMutation = GraphQLFieldResolver<any, Context, {}>

export const deleteMeMutation: DeleteMeMutation = (
  _parent,
  _args,
  context
): Promise<User | null> => {
  return deleteUser(ensureUser(context).id)
}

export type MeQuery = GraphQLFieldResolver<any, Context, {}>

export const meQuery: MeQuery = (_parent, _args, context): User | null => {
  return getUserFromContext(context as UserContext)
}

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
