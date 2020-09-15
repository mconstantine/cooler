import { gql } from 'apollo-server-express'

export default gql`
  type TaskEdge implements Edge {
    cursor: String!
    node: Task!
  }

  type TaskConnection implements Connection {
    pageInfo: PageInfo!
    edges: [TaskEdge]!
    totalCount: Int!
  }

  type Task implements TrackedNode & Node {
    id: Int!
    name: String!
    description: String
    expectedWorkingHours: Int!
    hourlyCost: Float!
    start_time: Date!
    created_at: Date!
    updated_at: Date!
    project: Project!
  }

  input TaskCreationInput {
    name: String!
    description: String
    expectedWorkingHours: Int!
    hourlyCost: Float!
    project: Int!
    start_time: Date!
  }

  input TaskUpdateInput {
    name: String
    description: String
    expectedWorkingHours: Int
    hourlyCost: Float
    project: Int
    start_time: Date
  }

  extend type User {
    tasks(
      first: Int
      last: Int
      before: String
      after: String
      orderBy: String
    ): TaskConnection
  }

  extend type Project {
    tasks(
      first: Int
      last: Int
      before: String
      after: String
      orderBy: String
    ): TaskConnection
  }

  extend type Mutation {
    createTask(task: TaskCreationInput!): Task
    updateTask(id: Int!, task: TaskUpdateInput!): Task
    deleteTask(id: Int!): Task
  }

  extend type Query {
    task(id: Int!): Task
    tasks(
      description: String
      first: Int
      last: Int
      before: String
      after: String
      orderBy: String
    ): TaskConnection!
  }
`
