import { gql } from 'apollo-server'

export default gql`
  type ProjectEdge implements Edge {
    cursor: String!
    node: Project!
  }

  type ProjectConnection implements Connection {
    pageInfo: PageInfo!
    edges: [ProjectEdge]!
    totalCount: Int!
  }

  type Project implements Node {
    id: Int
    name: String!
    description: String
    created_at: String
    updated_at: String
    client: Client!
    tasks(first: Int, last: Int, before: String, after: String, orderBy: String): TaskConnection
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
  }

  extend type Mutation {
    createProject(project: ProjectCreationInput!): Project!
    updateProject(id: Int!, project: ProjectUpdateInput!): Project
    deleteProject(id: Int!): Project
  }

  extend type Query {
    project(id: Int): Project
    projects(
      name: String,
      first: Int,
      last: Int,
      before: String,
      after: String,
      orderBy: String
    ): ProjectConnection!
  }
`
