import { gql } from 'apollo-server-express'

export default gql`
  type ProjectEdge implements Edge {
    cursor: String
    node: Project
  }

  type ProjectConnection implements Connection {
    pageInfo: PageInfo
    edges: [ProjectEdge]
    totalCount: Int
  }

  type Project implements TrackedNode & Node {
    id: Int
    name: String
    description: String
    created_at: Date
    updated_at: Date
    cashed_at: Date
    cashed_balance: Float
    client: Client
  }

  input ProjectCreationInput {
    name: String!
    description: String
    client: Int!
  }

  input ProjectUpdateInput {
    name: String
    description: String
    client: Int
    cashed_at: Date
    cashed_balance: Float
  }

  extend type User {
    projects(
      first: Int
      last: Int
      before: String
      after: String
      orderBy: String
    ): ProjectConnection
    cashedBalance(since: Date): Float
  }

  extend type Client {
    projects(
      first: Int
      last: Int
      before: String
      after: String
      orderBy: String
    ): ProjectConnection
  }

  extend type Mutation {
    createProject(project: ProjectCreationInput!): Project
    updateProject(id: Int!, project: ProjectUpdateInput!): Project
    deleteProject(id: Int!): Project
  }

  extend type Query {
    project(id: Int): Project
    projects(
      name: String
      first: Int
      last: Int
      before: String
      after: String
      orderBy: String
    ): ProjectConnection
  }

  # extend type Subscription {
  #   createdProject(client: Int): Project
  # }
`
