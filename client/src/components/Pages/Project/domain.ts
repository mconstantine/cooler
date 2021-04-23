import gql from 'graphql-tag'
import * as t from 'io-ts'
import { optionFromNullable } from 'io-ts-types'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import {
  Connection,
  ConnectionQueryInput,
  makeQuery
} from '../../../misc/graphql'

const ProjectForListClient = t.type(
  {
    name: LocalizedString
  },
  'ProjectForListClient'
)

const ProjectForList = t.type(
  {
    id: PositiveInteger,
    name: LocalizedString,
    description: optionFromNullable(LocalizedString),
    client: ProjectForListClient
  },
  'ProjectForList'
)
export type ProjectForList = t.TypeOf<typeof ProjectForList>

const ProjectsQueryOutput = t.type(
  {
    projects: Connection(ProjectForList)
  },
  'ProjectsQueryOutput'
)

export const projectsQuery = makeQuery({
  inputCodec: ConnectionQueryInput,
  outputCodec: ProjectsQueryOutput,
  query: gql`
    query projects($name: String, $first: Int!) {
      projects(name: $name, first: $first, orderBy: "name DESC") {
        totalCount
        pageInfo {
          startCursor
          endCursor
          hasPreviousPage
          hasNextPage
        }
        edges {
          cursor
          node {
            id
            name
            description
            client {
              name
            }
          }
        }
      }
    }
  `
})
