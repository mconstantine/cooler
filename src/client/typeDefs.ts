import { gql } from 'apollo-server'

export default gql`
  type ClientEdge implements Edge {
    cursor: String!
    node: Client!
  }

  type ClientConnection implements Connection {
    pageInfo: PageInfo!
    edges: [ClientEdge]!
    totalCount: Int!
  }

  type Client implements Node {
    id: Int
    name: String!
    created_at: String
    updated_at: String
    projects(first: Int, last: Int, before: String, after: String, orderBy: String): ProjectConnection
  }

  input ClientCreationInput {
    name: String!
  }

  input ClientUpdateInput {
    name: String
  }

  extend type Mutation {
    createClient(client: ClientCreationInput!): Client!
    updateClient(id: Int!, client: ClientUpdateInput!): Client
    deleteClient(id: Int!): Client
  }

  extend type Query {
    client(id: Int!): Client
    clients(
      name: String,
      first: Int,
      last: Int,
      before: String,
      after: String,
      orderBy: String
    ): ClientConnection!
  }
`
