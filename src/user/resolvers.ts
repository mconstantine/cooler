import { GraphQLFieldResolver } from 'graphql'
import { UserContext, User, AccessTokenResponse } from './interface'
import {
  createUser,
  loginUser,
  refreshToken,
  updateUser,
  deleteUser
} from './model'
import { ensureUser } from '../misc/ensureUser'

type CreateUserMutation = GraphQLFieldResolver<
  any,
  UserContext,
  { user: Pick<User, 'name' | 'email' | 'password'> }
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
  { user: Pick<User, 'email' | 'password'> }
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
  UserContext,
  { user: Partial<User> }
>

export const updateMeMutation: UpdateMeMutation = (
  _parent,
  { user },
  context
): Promise<User | null> => {
  return updateUser(ensureUser(context).id, user)
}

export type DeleteMeMutation = GraphQLFieldResolver<any, UserContext, {}>

export const deleteMeMutation: DeleteMeMutation = (
  _parent,
  _args,
  context
): Promise<User | null> => {
  return deleteUser(ensureUser(context).id)
}

export type MeQuery = GraphQLFieldResolver<any, UserContext, {}>

export const meQuery: MeQuery = (_parent, _args, context): User | null => {
  if (!context.user) {
    return null
  }

  return context.user
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
