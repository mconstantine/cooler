import { gql } from 'apollo-server'

export default gql`
  type Client {
    id: Int
    name: String!
  }
`
