import { gql } from 'apollo-server-express'

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

  type User implements TrackedNode & Node {
    id: Int!
    name: String!
    email: String!
    password: String!
    created_at: Date!
    updated_at: Date!
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
    expiration: Date!
  }

  extend type Mutation {
    createUser(user: UserCreationInput!): TokenResponse
    loginUser(user: UserLoginInput!): TokenResponse!
    updateMe(user: UserUpdateInput!): User
    deleteMe: User
    refreshToken(refreshToken: String!): TokenResponse!
  }

  extend type Query {
    me: User
  }
`
