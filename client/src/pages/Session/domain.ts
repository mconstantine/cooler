import * as t from 'io-ts'
import { makeGetRequest } from '../../effects/api/useApi'
import { Session } from '../../entities/Session'
import { ObjectId } from '../../globalDomain'

export const makeGetSessionRequest = (_id: ObjectId) =>
  makeGetRequest({
    url: `/sessions/${_id}`,
    inputCodec: t.void,
    outputCodec: Session
  })
