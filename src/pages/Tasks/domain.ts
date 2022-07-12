import * as t from 'io-ts'
import { makeGetRequest } from '../../effects/api/useApi'
import { TaskWithStats } from '../../entities/Task'
import { ObjectId } from '../../globalDomain'

export const makeTaskQuery = (_id: ObjectId) =>
  makeGetRequest({
    url: `/tasks/${_id}`,
    inputCodec: t.void,
    outputCodec: TaskWithStats
  })
