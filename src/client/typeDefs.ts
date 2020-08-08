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
    projects: ProjectConnection
  }

  input ClientCreationInput {
    name: String!
  }

  input ClientUpdateInput {
    name: String
  }

  extend type Mutation {
    createClient(client: ClientCreationInput!): Client!
    updateClient(id: Int!, client: ClientUpdateInput!): Client!
    deleteClient(id: Int!): Client!
  }
`
