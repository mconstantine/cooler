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

  enum ClientType {
    PRIVATE
    BUSINESS
  }

  type Client implements Node {
    id: Int
    type: ClientType!
    name: String!
    fiscal_code: String
    first_name: String
    last_name: String
    country_code: String
    vat_number: String
    business_name: String
    address_country: String!
    address_province: String!
    address_city: String!
    address_zip: String!
    address_street: String!
    address_street_number: String!
    address_email: String!
    created_at: String
    updated_at: String
    projects(first: Int, last: Int, before: String, after: String, orderBy: String): ProjectConnection
  }

  input ClientCreationInput {
    type: ClientType!
    fiscal_code: String
    first_name: String
    last_name: String
    country_code: String
    vat_number: String
    business_name: String
    address_country: String!
    address_province: String!
    address_city: String!
    address_zip: String!
    address_street: String!
    address_street_number: String!
    address_email: String!
  }

  input ClientUpdateInput {
    type: ClientType
    fiscal_code: String
    first_name: String
    last_name: String
    country_code: String
    vat_number: String
    business_name: String
    address_country: String
    address_province: String
    address_city: String
    address_zip: String
    address_street: String
    address_street_number: String
    address_email: String
  }

  extend type Mutation {
    createClient(client: ClientCreationInput!): Client!
    updateClient(id: Int!, client: ClientUpdateInput!): Client
    deleteClient(id: Int!): Client
  }

  extend type Query {
    client(id: Int!): Client
    clients(
      name: String,
      first: Int,
      last: Int,
      before: String,
      after: String,
      orderBy: String
    ): ClientConnection!
  }
`
