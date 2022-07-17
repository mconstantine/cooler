import { SessionCreationInput } from './../../entities/Session'
import * as t from 'io-ts'
import {
  makeDeleteRequest,
  makeGetRequest,
  makePutRequest
} from '../../effects/api/useApi'
import { Session } from '../../entities/Session'
import { TaskCreationInput, TaskWithStats } from '../../entities/Task'
import { ObjectId } from '../../globalDomain'
import { Connection, ConnectionQueryInput } from '../../misc/Connection'

export const makeTaskQuery = (_id: ObjectId) =>
  makeGetRequest({
    url: `/tasks/${_id}`,
    inputCodec: t.void,
    outputCodec: TaskWithStats
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
    url: `/sessions/${taskId}`,
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
