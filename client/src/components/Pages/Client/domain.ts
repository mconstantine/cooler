import { Reader } from 'fp-ts/Reader'
import * as t from 'io-ts'
import {
  makeDeleteRequest,
  makeGetRequest,
  makePostRequest,
  makePutRequest
} from '../../../effects/api/useApi'
import { Client, ClientCreationInput } from '../../../entities/Client'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import { Connection, ConnectionQueryInput } from '../../../misc/Connection'

const PrivateClientForList = t.type(
  {
    id: PositiveInteger,
    type: t.literal('PRIVATE'),
    first_name: LocalizedString,
    last_name: LocalizedString
  },
  'PrivateClientForList'
)
type PrivateClientForList = t.TypeOf<typeof PrivateClientForList>

const BusinessClientForList = t.type(
  {
    id: PositiveInteger,
    type: t.literal('BUSINESS'),
    business_name: LocalizedString
  },
  'BusinessClientForList'
)
type BusinessClientForList = t.TypeOf<typeof BusinessClientForList>

const ClientForList = t.union(
  [PrivateClientForList, BusinessClientForList],
  'ClientForList'
)
export type ClientForList = t.TypeOf<typeof ClientForList>

export function foldClientForList<T>(cases: {
  [k in ClientForList['type']]: Reader<Extract<ClientForList, { type: k }>, T>
}): Reader<ClientForList, T> {
  return client => cases[client.type](client as any)
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
