import { GraphQLFieldResolver } from 'graphql'
import { Client } from './Client'
import { createClient } from './model'
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
  }
}

export default {
  Client: {
    projects: (client, args, _context) => {
      return queryToConnection(args, ['*'], 'project', undefined, SQL`WHERE client = ${client.id}`)
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
    }
  }
} as ClientResolvers
