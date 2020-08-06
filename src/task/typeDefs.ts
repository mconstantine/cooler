import { gql } from 'apollo-server'

export default gql`
  type Task {
    id: Int
    description: String!
    expectedWorkingHours: Int!
    actualWorkingHours: Int!
  }
`
