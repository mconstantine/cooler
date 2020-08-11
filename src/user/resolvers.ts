import { GraphQLFieldResolver } from 'graphql'
import { User, UserContext } from './User'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { createUser, loginUser, refreshToken, updateUser, deleteUser, listUsers } from './model'
import { queryToConnection } from '../misc/queryToConnection'
import SQL from 'sql-template-strings'
import { ensureUser } from '../misc/ensureUser'
import { getDatabase } from '../misc/getDatabase'

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
    updateUser: GraphQLFieldResolver<any, UserContext, { id?: number, user: Partial<User> }>
    deleteUser: GraphQLFieldResolver<any, UserContext, { id: number }>
  }
  Query: {
    me: GraphQLFieldResolver<any, UserContext, {}>
    user: GraphQLFieldResolver<any, UserContext, { id: number }>
    users: GraphQLFieldResolver<any, UserContext, ConnectionQueryArgs & {
      name?: string,
      email?: string
    }>
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
    updateUser: (_parent, { id, user }, context) => {
      ensureUser(context)

      if (!id) {
        id = context.user!.id
      }

      return updateUser(id, user)
    },
    deleteUser(_parent, { id }, context) {
      ensureUser(context)
      return deleteUser(id)
    }
  },
  Query: {
    me: (_parent, _args, context) => {
      if (!context.user) {
        return null
      }

      return context.user
    },
    user: async (_parent, { id }, context) => {
      ensureUser(context)
      const db = await getDatabase()
      return await db.get<User>(SQL`SELECT * FROM user WHERE id = ${id}`)
    },
    users: (_parent, args, context) => {
      ensureUser(context)
      return listUsers(args)
    }
  }
} as UserResolvers
