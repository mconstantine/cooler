import { GraphQLFieldResolver } from 'graphql'
import { User, UserContext } from './interface'
import {
  createUser,
  loginUser,
  refreshToken,
  updateUser,
  deleteUser
} from './model'
import { ensureUser } from '../misc/ensureUser'

interface UserResolvers {
  Mutation: {
    createUser: GraphQLFieldResolver<any, UserContext, { user: Partial<User> }>
    loginUser: GraphQLFieldResolver<any, { user: Partial<User> }>
    refreshToken: GraphQLFieldResolver<any, { refreshToken: string }>
    updateMe: GraphQLFieldResolver<any, UserContext, { user: Partial<User> }>
    deleteMe: GraphQLFieldResolver<any, UserContext, {}>
  }
  Query: {
    me: GraphQLFieldResolver<any, UserContext, {}>
  }
}

export default {
  Mutation: {
    createUser: (_parent, { user: { name, email, password } }, context) => {
      return createUser(
        { name: name!, email: email!, password: password! },
        context
      )
    },
    loginUser: (_parent, { user: { email, password } }) => {
      return loginUser({ email, password })
    },
    refreshToken: (_parent, { refreshToken: token }) => {
      return refreshToken({ refreshToken: token })
    },
    updateMe: (_parent, { user }, context) => {
      ensureUser(context)
      return updateUser(context.user!.id, user)
    },
    deleteMe: (_parent, _args, context) => {
      ensureUser(context)
      return deleteUser(context.user!.id)
    }
  },
  Query: {
    me: (_parent, _args, context) => {
      if (!context.user) {
        return null
      }

      return context.user
    }
  }
} as UserResolvers
