import { gql } from 'apollo-server'

export default gql`
  type Task implements Node {
    id: Int
    description: String!
    expectedWorkingHours: Int!
    actualWorkingHours: Int!
    created_at: String
    updated_at: String
  }
`
