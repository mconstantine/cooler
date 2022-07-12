import { Reader } from 'fp-ts/Reader'
import * as t from 'io-ts'
import {
  makeDeleteRequest,
  makeGetRequest,
  makePostRequest,
  makePutRequest
} from '../../effects/api/useApi'
import { Client, ClientCreationInput } from '../../entities/Client'
import { LocalizedString, ObjectId } from '../../globalDomain'
import { Connection, ConnectionQueryInput } from '../../misc/Connection'

const PrivateClientForList = t.type(
  {
    _id: ObjectId,
    type: t.literal('PRIVATE'),
    firstName: LocalizedString,
    lastName: LocalizedString
  },
  'PrivateClientForList'
)
type PrivateClientForList = t.TypeOf<typeof PrivateClientForList>

const BusinessClientForList = t.type(
  {
    _id: ObjectId,
    type: t.literal('BUSINESS'),
    businessName: LocalizedString
  },
  'BusinessClientForList'
)
type BusinessClientForList = t.TypeOf<typeof BusinessClientForList>

export const ClientForList = t.union(
  [PrivateClientForList, BusinessClientForList],
  'ClientForList'
)
export type ClientForList = t.TypeOf<typeof ClientForList>

export function foldClientForList<T>(cases: {
  PRIVATE: Reader<PrivateClientForList, T>
  BUSINESS: Reader<BusinessClientForList, T>
}): Reader<ClientForList, T> {
  return client =>
    'firstName' in client ? cases.PRIVATE(client) : cases.BUSINESS(client)
}

export const clientsQuery = makeGetRequest({
  url: '/clients',
  inputCodec: ConnectionQueryInput,
  outputCodec: Connection(ClientForList)
})

export const makeClientQuery = (_id: ObjectId) =>
  makeGetRequest({
    url: `/clients/${_id}`,
    inputCodec: t.void,
    outputCodec: Client
  })

export const createClientRequest = makePostRequest({
  url: '/clients',
  inputCodec: ClientCreationInput,
  outputCodec: Client
})

export const makeUpdateClientRequest = (_id: ObjectId) =>
  makePutRequest({
    url: `/clients/${_id}`,
    inputCodec: ClientCreationInput,
    outputCodec: Client
  })

export const makeDeleteClientRequest = (_id: ObjectId) =>
  makeDeleteRequest({
    url: `/clients/${_id}`,
    inputCodec: t.void,
    outputCodec: Client
  })
