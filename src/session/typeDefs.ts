import { gql } from 'apollo-server-express'

export default gql`
  type SessionEdge implements Edge {
    cursor: String!
    node: Session!
  }

  type SessionConnection implements Connection {
    pageInfo: PageInfo!
    edges: [SessionEdge]!
    totalCount: Int!
  }

  type Session implements Node {
    id: Int!
    start_time: Date!
    end_time: Date
    task: Task
  }

  input SessionUpdateInput {
    start_time: Date
    end_time: Date
  }

  input CreateTimesheetInput {
    since: Date!
    to: Date!
    project: Int!
  }

  extend type Mutation {
    startSession(task: Int!): Session
    stopSession(id: Int!): Session
    updateSession(id: Int!, session: SessionUpdateInput): Session
    deleteSession(id: Int!): Session
    createTimesheet(for: CreateTimesheetInput!): String
  }

  extend type Query {
    session(id: Int!): Session
    sessions(
      task: Int
      first: Int
      last: Int
      before: String
      after: String
      orderBy: String
    ): SessionConnection!
  }

  extend type User {
    expectedWorkingHours(since: Date): Int!
    actualWorkingHours(since: Date): Float!
    budget(since: Date): Float!
    balance(since: Date): Float!
  }

  extend type Task {
    sessions(
      first: Int
      last: Int
      before: String
      after: String
      orderBy: String
    ): SessionConnection
    actualWorkingHours: Float!
    budget: Float!
    balance: Float!
  }

  extend type Project {
    expectedWorkingHours: Int!
    actualWorkingHours: Float!
    budget: Float!
    balance: Float!
  }

  extend type User {
    openSession: Session
  }
`
