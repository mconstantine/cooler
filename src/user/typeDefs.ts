import { gql } from 'apollo-server'

export default gql`
  type UserEdge implements Edge {
    cursor: String!
    node: User!
  }

  type UserConnection implements Connection {
    pageInfo: PageInfo!
    edges: [UserEdge]!
    totalCount: Int!
  }

  type User implements Node {
    id: Int
    name: String!
    email: String!
    password: String!
    created_at: String
    updated_at: String
  }

  input UserCreationInput {
    name: String!
    email: String!
    password: String!
  }

  input UserLoginInput {
    email: String!
    password: String!
  }

  input UserUpdateInput {
    name: String
    email: String
    password: String
  }

  type TokenResponse {
    accessToken: String!
    refreshToken: String!
    expiration: String!
  }

  extend type Mutation {
    createUser(user: UserCreationInput): TokenResponse!
    loginUser(user: UserLoginInput): TokenResponse!
    updateMe(user: UserUpdateInput): Task
    deleteMe: User
    refreshToken(refreshToken: String!): TokenResponse!
  }

  extend type Query {
    me: User
    user(id: Int!): User
    users(
      name: String,
      email: String,
      first: Int,
      last: Int,
      before: String,
      after: String,
      orderBy: String
    ): UserConnection!
  }
`
