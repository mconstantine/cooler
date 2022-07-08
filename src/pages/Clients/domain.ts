import { Reader } from 'fp-ts/Reader'
import * as t from 'io-ts'
import {
  makeDeleteRequest,
  makeGetRequest,
  makePostRequest,
  makePutRequest
} from '../../effects/api/useApi'
import { Client, ClientCreationInput } from '../../entities/Client'
import { LocalizedString, ObjectId, PositiveInteger } from '../../globalDomain'
import { Connection, ConnectionQueryInput } from '../../misc/Connection'

const PrivateClientForList = t.type(
  {
    _id: ObjectId,
    firstName: LocalizedString,
    lastName: LocalizedString
  },
  'PrivateClientForList'
)
type PrivateClientForList = t.TypeOf<typeof PrivateClientForList>

const BusinessClientForList = t.type(
  {
    _id: ObjectId,
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

export const makeClientQuery = (id: PositiveInteger) =>
  makeGetRequest({
    url: `/clients/${id}`,
    inputCodec: t.void,
    outputCodec: Client
  })

export const createClientRequest = makePostRequest({
  url: '/clients',
  inputCodec: ClientCreationInput,
  outputCodec: Client
})

export const makeUpdateClientMutation = (id: PositiveInteger) =>
  makePutRequest({
    url: `/clients/${id}`,
    inputCodec: ClientCreationInput,
    outputCodec: Client
  })

export const makeDeleteClientRequest = (id: PositiveInteger) =>
  makeDeleteRequest({
    url: `/clients/${id}`,
    inputCodec: t.void,
    outputCodec: Client
  })
