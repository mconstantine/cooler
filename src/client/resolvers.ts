import { GraphQLFieldResolver } from 'graphql'
import { Client, ClientType } from './interface'
import { createClient, listClients, updateClient, deleteClient, getClient } from './model'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { ensureUser } from '../misc/ensureUser'
import { UserContext, User } from '../user/interface'
import { getDatabase } from '../misc/getDatabase'

interface ClientResolvers {
  Client: {
    name: GraphQLFieldResolver<Client, UserContext>
    user: GraphQLFieldResolver<Client, UserContext>
  }
  User: {
    clients: GraphQLFieldResolver<User, ConnectionQueryArgs>
  }
  Mutation: {
    createClient: GraphQLFieldResolver<any, UserContext, { client: Partial<Client> }>
    updateClient: GraphQLFieldResolver<any, UserContext, { id: number, client: Partial<Client> }>
    deleteClient: GraphQLFieldResolver<any, UserContext, { id: number }>
  }
  Query: {
    client: GraphQLFieldResolver<any, UserContext, { id: number }>
    clients: GraphQLFieldResolver<any, UserContext, ConnectionQueryArgs & { name?: string }>
  }
}

export default {
  Client: {
    name: client => {
      return client.type === ClientType.BUSINESS
      ? client.business_name
      : `${client.first_name} ${client.last_name}`
    },
    user: async client => {
      const db = await getDatabase()
      return db.get<User>(SQL`SELECT * FROM user WHERE id = ${client.user}`)
    }
  },
  User: {
    clients: (user, args) => {
      return queryToConnection(args, ['*'], 'client', SQL`WHERE user = ${user.id}`)
    }
  },
  Mutation: {
    createClient: (_parent, { client }, context) => {
      ensureUser(context)
      return createClient({ ...client }, context.user!)
    },
    updateClient: (_parent, { id, client }, context) => {
      ensureUser(context)
      return updateClient(id, client, context.user!)
    },
    deleteClient: (_parent, { id }, context) => {
      ensureUser(context)
      return deleteClient(id, context.user!)
    }
  },
  Query: {
    client: async (_parent, { id }, context) => {
      ensureUser(context)
      return await getClient(id, context.user!)
    },
    clients: async (_parent, args, context) => {
      ensureUser(context)
      return listClients(args, context.user!)
    }
  }
} as ClientResolvers
