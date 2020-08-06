import { gql } from 'apollo-server'

export default gql`
  type Project {
    id: Int
    name: String!
    description: String
  }
`
