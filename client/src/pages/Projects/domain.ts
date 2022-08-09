import * as t from 'io-ts'
import { optionFromNullable } from 'io-ts-types'
import {
  makeDeleteRequest,
  makeGetRequest,
  makePostRequest,
  makePutRequest
} from '../../effects/api/useApi'
import {
  Project,
  ProjectCreationInput,
  ProjectWithStats
} from '../../entities/Project'
import { Task } from '../../entities/Task'
import { ObjectId } from '../../globalDomain'
import { Connection, ConnectionQueryInput } from '../../misc/Connection'

const ProjectQueryFilters = t.type(
  {
    cashed: optionFromNullable(t.boolean),
    withInvoiceData: optionFromNullable(t.boolean),
    started: optionFromNullable(t.boolean),
    ended: optionFromNullable(t.boolean)
  },
  'ProjectQueryFilters'
)

const GetProjectsRequestInput = t.intersection(
  [ConnectionQueryInput, ProjectQueryFilters],
  'GetProjectsRequestInput'
)
export type GetProjectsRequestInput = t.TypeOf<typeof GetProjectsRequestInput>

export const getProjectsRequest = makeGetRequest({
  url: '/projects',
  inputCodec: GetProjectsRequestInput,
  outputCodec: Connection(Project)
})

export const makeGetProjectQuery = (_id: ObjectId) =>
  makeGetRequest({
    url: `/projects/${_id}`,
    inputCodec: t.void,
    outputCodec: ProjectWithStats
  })

export const createProjectRequest = makePostRequest({
  url: '/projects',
  inputCodec: ProjectCreationInput,
  outputCodec: Project
})

export const makeUpdateProjectRequest = (_id: ObjectId) =>
  makePutRequest({
    url: `/projects/${_id}`,
    inputCodec: ProjectCreationInput,
    outputCodec: ProjectWithStats
  })

export const makeDeleteProjectRequest = (_id: ObjectId) =>
  makeDeleteRequest({
    url: `/projects/${_id}`,
    inputCodec: t.void,
    outputCodec: Project
  })

const ProjectTasksConnectionQueryInput = t.intersection(
  [
    ConnectionQueryInput,
    t.type({
      project: ObjectId
    })
  ],
  'ProjectTasksConnectionQueryInput'
)
export type ProjectTasksConnectionQueryInput = t.TypeOf<
  typeof ProjectTasksConnectionQueryInput
>

export const getProjectTasksRequest = makeGetRequest({
  url: `/tasks`,
  inputCodec: ProjectTasksConnectionQueryInput,
  outputCodec: Connection(Task)
})
