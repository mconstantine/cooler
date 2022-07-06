import * as t from 'io-ts'
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
import { ObjectId } from '../../globalDomain'
import { Connection, ConnectionQueryInput } from '../../misc/Connection'

export const getProjectsRequest = makeGetRequest({
  url: '/projects',
  inputCodec: ConnectionQueryInput,
  outputCodec: Connection(Project)
})

export const makeProjectQuery = (_id: ObjectId) =>
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
