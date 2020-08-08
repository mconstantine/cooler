import { gql } from 'apollo-server'

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

  type Task implements Node {
    id: Int
    description: String!
    expectedWorkingHours: Int!
    actualWorkingHours: Int
    created_at: String
    updated_at: String
    project: Project!
  }

  input TaskCreationInput {
    description: String!
    expectedWorkingHours: Int!
    actualWorkingHours: Int
    project: Int!
  }

  input TaskUpdateInput {
    description: String
    expectedWorkingHours: Int
    actualWorkingHours: Int
    project: Int
  }

  extend type Mutation {
    createTask(task: TaskCreationInput): Task!
    updateTask(id: Int!, task: TaskUpdateInput): Task!
    deleteTask(id: Int!): Task!
  }

  extend type Query {
    task(id: Int!): Task
    tasks(description: String, first: Int, last: Int, before: String, after: String): TaskConnection!
  }
`
