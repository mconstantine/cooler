import gql from 'graphql-tag'
import * as t from 'io-ts'
import { optionFromNullable } from 'io-ts-types'
import {
  ProjectFromAPI,
  ProjectCreationInputFromAPI
} from '../../../entities/Project'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import {
  Connection,
  ConnectionQueryInput,
  makeMutation,
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
              id
              name
              user {
                taxes {
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
                      label
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `
})

const ProjectQueryInput = t.type(
  {
    id: PositiveInteger
  },
  'ProjectQueryInput'
)

const ProjectQueryOutput = t.type(
  {
    project: ProjectFromAPI
  },
  'ProjectQueryOutput'
)

export const projectQuery = makeQuery({
  inputCodec: ProjectQueryInput,
  outputCodec: ProjectQueryOutput,
  query: gql`
    query project($id: Int!) {
      project(id: $id) {
        id
        name
        description
        client {
          id
          name
          user {
            taxes {
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
                  label
                  value
                }
              }
            }
          }
        }
        cashed_at
        cashed_balance
        created_at
        updated_at
        expectedWorkingHours
        actualWorkingHours
        budget
        balance
      }
    }
  `
})

const CreateProjectMutationInput = t.type(
  {
    project: ProjectCreationInputFromAPI
  },
  'CreateProjectMutationInput'
)

const CreateProjectMutationOutput = t.type(
  {
    createProject: ProjectFromAPI
  },
  'CreateProjectMutationOutput'
)

export const createProjectMutation = makeMutation({
  inputCodec: CreateProjectMutationInput,
  outputCodec: CreateProjectMutationOutput,
  query: gql`
    mutation createProject($project: ProjectCreationInput!) {
      createProject(project: $project) {
        id
        name
        description
        client {
          id
          name
          user {
            taxes {
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
                  label
                  value
                }
              }
            }
          }
        }
        cashed_at
        cashed_balance
        created_at
        updated_at
        expectedWorkingHours
        actualWorkingHours
        budget
        balance
      }
    }
  `
})

const UpdateProjectMutationInput = t.type(
  {
    id: PositiveInteger,
    project: ProjectCreationInputFromAPI
  },
  'UpdateProjectMutationInput'
)

const UpdateProjectMutationOutput = t.type(
  {
    updateProject: ProjectFromAPI
  },
  'UpdateProjectMutationOutput'
)

export const updateProjectMutation = makeMutation({
  inputCodec: UpdateProjectMutationInput,
  outputCodec: UpdateProjectMutationOutput,
  query: gql`
    mutation updateProject($id: Int!, $project: ProjectUpdateInput!) {
      updateProject(id: $id, project: $project) {
        id
        name
        description
        client {
          id
          name
          user {
            taxes {
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
                  label
                  value
                }
              }
            }
          }
        }
        cashed_at
        cashed_balance
        created_at
        updated_at
        expectedWorkingHours
        actualWorkingHours
        budget
        balance
      }
    }
  `
})

const DeleteProjectMutationInput = t.type(
  {
    id: PositiveInteger
  },
  'DeleteProjectMutationInput'
)

const DeleteProjectMutationOutput = t.type(
  {
    deleteProject: ProjectFromAPI
  },
  'DeleteProjectMutationOutput'
)

export const deleteProjectMutation = makeMutation({
  inputCodec: DeleteProjectMutationInput,
  outputCodec: DeleteProjectMutationOutput,
  query: gql`
    mutation deleteProject($id: Int!) {
      deleteProject(id: $id) {
        id
        name
        description
        client {
          id
          name
          user {
            taxes {
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
                  label
                  value
                }
              }
            }
          }
        }
        cashed_at
        cashed_balance
        created_at
        updated_at
        expectedWorkingHours
        actualWorkingHours
        budget
        balance
      }
    }
  `
})
