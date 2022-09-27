import { SessionCreationInput, Session } from './../../entities/Session'
import * as t from 'io-ts'
import {
  makeDeleteRequest,
  makeGetRequest,
  makePostRequest,
  makePutRequest
} from '../../effects/api/useApi'
import {
  Task,
  TaskCreationInput,
  TasksBatchCreationInput,
  TaskWithStats
} from '../../entities/Task'
import { NonNegativeInteger, ObjectId } from '../../globalDomain'
import { Connection, ConnectionQueryInput } from '../../misc/Connection'

export const makeTaskQuery = (_id: ObjectId) =>
  makeGetRequest({
    url: `/tasks/${_id}`,
    inputCodec: t.void,
    outputCodec: TaskWithStats
  })

export const makeGetPreviousTaskQuery = (_id: ObjectId) =>
  makeGetRequest({
    url: `/tasks/${_id}/previous`,
    inputCodec: t.void,
    outputCodec: Task
  })

export const makeGetNextTaskQuery = (_id: ObjectId) =>
  makeGetRequest({
    url: `/tasks/${_id}/next`,
    inputCodec: t.void,
    outputCodec: Task
  })

export const makeCreateTaskRequest = makePostRequest({
  url: '/tasks',
  inputCodec: TaskCreationInput,
  outputCodec: Task
})

export const makeCreateTasksBatchRequest = makePostRequest({
  url: '/tasks/batch',
  inputCodec: TasksBatchCreationInput,
  outputCodec: t.array(Task)
})

export const makeUpdateTaskRequest = (_id: ObjectId) =>
  makePutRequest({
    url: `/tasks/${_id}`,
    inputCodec: TaskCreationInput,
    outputCodec: TaskWithStats
  })

export const makeDeleteTaskRequest = (_id: ObjectId) =>
  makeDeleteRequest({
    url: `/tasks/${_id}`,
    inputCodec: t.void,
    outputCodec: TaskWithStats
  })

export const makeGetSessionsRequest = (taskId: ObjectId) =>
  makeGetRequest({
    url: `/sessions/task/${taskId}`,
    inputCodec: ConnectionQueryInput,
    outputCodec: Connection(Session)
  })

export const makeUpdateSessionRequest = (sessionId: ObjectId) =>
  makePutRequest({
    url: `/sessions/${sessionId}`,
    inputCodec: SessionCreationInput,
    outputCodec: Session
  })

export const makeDeleteSessionRequest = (sessionId: ObjectId) =>
  makeDeleteRequest({
    url: `/sessions/${sessionId}`,
    inputCodec: t.void,
    outputCodec: Session
  })

export const startSessionRequest = makePostRequest({
  url: `/sessions`,
  inputCodec: SessionCreationInput,
  outputCodec: Session
})

const TruncationRequestOutput = t.type(
  {
    deletedCount: NonNegativeInteger
  },
  'TruncationRequestOutput'
)
export type TruncationRequestOutput = t.TypeOf<typeof TruncationRequestOutput>

export const makeTruncateTasksRequest = (_id: ObjectId) =>
  makeDeleteRequest({
    url: `/tasks/${_id}/truncate`,
    inputCodec: t.void,
    outputCodec: TruncationRequestOutput
  })
