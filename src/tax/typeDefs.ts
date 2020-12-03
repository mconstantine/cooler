import { gql } from 'apollo-server-express'

export default gql`
  type TaxEdge implements Edge {
    cursor: String!
    node: Tax!
  }

  type TaxConnection implements Connection {
    pageInfo: PageInfo!
    edges: [TaxEdge]!
    totalCount: Int!
  }

  type Tax implements Node {
    id: Int!
    label: String!
    value: Float!
    user: User!
  }

  input TaxCreationInput {
    label: String!
    value: Float!
  }

  input TaxUpdateInput {
    label: String
    value: Float
  }

  extend type Mutation {
    createTax(tax: TaxCreationInput!): Tax
    updateTax(id: Int!, tax: TaxUpdateInput!): Tax
    deleteTax(id: Int!): Tax
  }

  extend type Query {
    tax(id: Int!): Tax
    taxes(
      first: Int
      last: Int
      before: String
      after: String
      orderBy: String
    ): TaxConnection!
  }

  # extend type Subscription {
  #   createdTax: Tax!
  # }

  extend type User {
    taxes(
      first: Int
      last: Int
      before: String
      after: String
      orderBy: String
    ): TaxConnection!
  }
`
