import { GraphQLFieldResolver } from 'graphql'
import { Client } from './Client'
import { createClient } from './model'

interface ClientResolvers {
  Mutation: {
    createClient: GraphQLFieldResolver<any, { client: Partial<Client> }>
  }
}

export default {
  Mutation: {
    createClient: (_parent, { client }) => {
      return createClient(client)
    }
  }
} as ClientResolvers
