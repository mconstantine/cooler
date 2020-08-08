import { GraphQLFieldResolver } from 'graphql'
import { Client } from './Client'
import { createClient } from './model'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'

interface ClientResolvers {
  Mutation: {
    createClient: GraphQLFieldResolver<any, { client: Partial<Client> }>
  }
  Query: {
    client: GraphQLFieldResolver<any, { id: number }>
  }
}

export default {
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
