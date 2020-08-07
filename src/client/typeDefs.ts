import { gql } from 'apollo-server'

export default gql`
  type Client implements Node {
    id: Int
    name: String!
    created_at: String
    updated_at: String
  }
`
