import { GraphQLFieldResolver } from 'graphql'
import { Client } from './Client'
import { createClient, listClients, updateClient, deleteClient, getClient } from './model'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { ensureUser } from '../misc/ensureUser'
import { UserContext } from '../user/User'

interface ClientResolvers {
  Client: {
    projects: GraphQLFieldResolver<Client, ConnectionQueryArgs>
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
    projects: (client, args, _context) => {
      return queryToConnection(args, ['*'], 'project', SQL`WHERE client = ${client.id}`)
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
