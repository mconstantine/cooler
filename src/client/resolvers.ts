import { GraphQLFieldResolver } from 'graphql'
import { Client } from './Client'
import { createClient, listClients } from './model'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'

interface ClientResolvers {
  Client: {
    projects: GraphQLFieldResolver<Client, ConnectionQueryArgs>
  }
  Mutation: {
    createClient: GraphQLFieldResolver<any, { client: Partial<Client> }>
  }
  Query: {
    client: GraphQLFieldResolver<any, { id: number }>
    clients: GraphQLFieldResolver<any, ConnectionQueryArgs & { name?: string }>
  }
}

export default {
  Client: {
    projects: (client, args, _context) => {
      return queryToConnection(args, ['*'], 'project', SQL`WHERE client = ${client.id}`)
    }
  },
  Mutation: {
    createClient: (_parent, { client }) => {
      return createClient(client)
    }
  },
  Query: {
    client: async (_parent, { id }) => {
      const db = await getDatabase()
      return await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${id}`)
    },
    clients: async (_parent, args) => {
      return listClients(args)
    }
  }
} as ClientResolvers
