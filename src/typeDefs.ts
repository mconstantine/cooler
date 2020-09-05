import userTypeDefs from './user/typeDefs'
import clientTypeDefs from './client/typeDefs'
import projectTypeDefs from './project/typeDefs'
import taskTypeDefs from './task/typeDefs'
import sessionTypeDefs from './session/typeDefs'
import taxTypeDefs from './tax/typeDefs'
import { gql } from 'apollo-server-express'

const defaultTypeDefs = gql`
  type PageInfo {
    startCursor: String!
    endCursor: String!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  interface Node {
    id: Int
  }

  interface TrackedNode implements Node {
    id: Int
    created_at: String
    updated_at: String
  }

  interface Edge {
    cursor: String!
    node: Node!
  }

  interface Connection {
    pageInfo: PageInfo!
    edges: [Edge]!
    totalCount: Int!
  }

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`

export const typeDefs = [
  defaultTypeDefs,
  userTypeDefs,
  clientTypeDefs,
  projectTypeDefs,
  taskTypeDefs,
  sessionTypeDefs,
  taxTypeDefs
]
