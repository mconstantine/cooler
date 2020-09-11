import { GraphQLFieldResolver } from 'graphql'
import {
  UserFromDatabase,
  AccessTokenResponse,
  Context,
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

type CreateUserMutation = GraphQLFieldResolver<
  any,
  Context,
  { user: Pick<UserFromDatabase, 'name' | 'email' | 'password'> }
>

const createUserMutation: CreateUserMutation = (
  _parent,
  { user: { name, email, password } },
  context
): Promise<AccessTokenResponse> => {
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
  { user: Pick<UserFromDatabase, 'email' | 'password'> }
>

const loginUserMutation: LoginUserMutation = (
  _parent,
  { user: { email, password } }
): Promise<AccessTokenResponse> => {
  return loginUser({ email, password })
}

export type RefreshTokenMutation = GraphQLFieldResolver<
  any,
  any,
  { refreshToken: string }
>

export const refreshTokenMutation: RefreshTokenMutation = (
  _parent,
  { refreshToken: token }
): Promise<AccessTokenResponse> => {
  return refreshToken({ refreshToken: token })
}

export type UpdateMeMutation = GraphQLFieldResolver<
  any,
  Context,
  { user: Partial<Pick<User, 'name' | 'email' | 'password'>> }
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
  return getUserFromContext(context)
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
