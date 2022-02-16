import * as t from 'io-ts'
import { optionFromNullable } from 'io-ts-types'
import {
  makeDeleteRequest,
  makeGetRequest,
  makePostRequest,
  makePutRequest
} from '../../effects/api/useApi'
import {
  ProjectFromAPI,
  ProjectCreationInputFromAPI
} from '../../entities/Project'
import { LocalizedString, PositiveInteger } from '../../globalDomain'
import { Connection, ConnectionQueryInput } from '../../misc/Connection'

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

export const projectsQuery = makeGetRequest({
  url: '/projects',
  inputCodec: ConnectionQueryInput,
  outputCodec: Connection(ProjectForList)
})

export const makeProjectQuery = (id: PositiveInteger) =>
  makeGetRequest({
    url: `/projects/${id}`,
    inputCodec: t.void,
    outputCodec: ProjectFromAPI
  })

export const createProjectRequest = makePostRequest({
  url: '/projects',
  inputCodec: ProjectCreationInputFromAPI,
  outputCodec: ProjectFromAPI
})

export const makeUpdateProjectRequest = (id: PositiveInteger) =>
  makePutRequest({
    url: `/projects/${id}`,
    inputCodec: ProjectCreationInputFromAPI,
    outputCodec: ProjectFromAPI
  })

export const makeDeleteProjectRequest = (id: PositiveInteger) =>
  makeDeleteRequest({
    url: `/projects/${id}`,
    inputCodec: t.void,
    outputCodec: ProjectFromAPI
  })
