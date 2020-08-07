import { gql } from 'apollo-server'

export default gql`
  type Project implements Node {
    id: Int
    name: String!
    description: String
    created_at: String
    updated_at: String
  }
`
