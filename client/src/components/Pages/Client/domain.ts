import { Reader } from 'fp-ts/Reader'
import gql from 'graphql-tag'
import * as t from 'io-ts'
import { NonEmptyString, optionFromNullable } from 'io-ts-types'
import {
  LocalizedString,
  optionFromUndefined,
  PositiveInteger
} from '../../../globalDomain'
import { Connection, Cursor, makeQuery } from '../../../misc/graphql'

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

export function foldClientForList<T>(
  whenPrivate: Reader<PrivateClientForList, T>,
  whenBusiness: Reader<BusinessClientForList, T>
): Reader<ClientForList, T> {
  return client => {
    switch (client.type) {
      case 'PRIVATE':
        return whenPrivate(client)
      case 'BUSINESS':
        return whenBusiness(client)
    }
  }
}

const ClientsQueryInput = t.type(
  {
    name: optionFromNullable(NonEmptyString),
    first: PositiveInteger,
    after: optionFromUndefined(Cursor)
  },
  'ClientsQueryInput'
)
export type ClientsQueryInput = t.TypeOf<typeof ClientsQueryInput>

const ClientsQueryOutput = t.type(
  {
    clients: Connection(ClientForList)
  },
  'ClientsQueryOutput'
)

export const clientsQuery = makeQuery({
  query: gql`
    query clients($name: String, $first: Int!, $after: String) {
      clients(name: $name, first: $first, after: $after) {
        totalCount
        pageInfo {
          startCursor
          endCursor
          hasPreviousPage
          hasNextPage
        }
        edges {
          cursor
          node {
            id
            type
            first_name
            last_name
            business_name
          }
        }
      }
    }
  `,
  inputCodec: ClientsQueryInput,
  outputCodec: ClientsQueryOutput
})
