import { GraphQLFieldResolver } from 'graphql'
import { User, UserContext } from './User'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { createUser, loginUser, refreshToken, updateUser, deleteUser } from './model'
import { queryToConnection } from '../misc/queryToConnection'
import SQL from 'sql-template-strings'
import { ensureUser } from '../misc/ensureUser'

interface UserResolvers {
  User: {
    clients: GraphQLFieldResolver<User, ConnectionQueryArgs>,
    projects: GraphQLFieldResolver<User, ConnectionQueryArgs>,
    tasks: GraphQLFieldResolver<User, ConnectionQueryArgs>
  }
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
  User: {
    clients: (user, args) => {
      return queryToConnection(args, ['*'], 'client', SQL`WHERE user = ${user.id}`)
    },
    projects: (user, args) => {
      return queryToConnection(args, ['project.*'], 'client', SQL`
        JOIN project ON project.client = client.id
        WHERE client.user = ${user.id}
      `)
    },
    tasks: (user, args) => {
      return queryToConnection(args, ['task.*'], 'client', SQL`
        JOIN project ON project.client = client.id
        JOIN task ON task.project = project.id
        WHERE client.user = ${user.id}
      `)
    }
  },
  Mutation: {
    createUser: (_parent, { user: { name, email, password } }, context) => {
      return createUser({ name: name!, email: email!, password: password! }, context)
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
    deleteMe(_parent, _args, context) {
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
