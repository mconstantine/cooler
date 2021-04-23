import { Reader } from 'fp-ts/Reader'
import gql from 'graphql-tag'
import * as t from 'io-ts'
import { Client, ClientCreationInput } from '../../../entities/Client'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import {
  Connection,
  ConnectionQueryInput,
  makeMutation,
  makeQuery
} from '../../../misc/graphql'

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

const ClientsQueryOutput = t.type(
  {
    clients: Connection(ClientForList)
  },
  'ClientsQueryOutput'
)

export const clientsQuery = makeQuery({
  query: gql`
    query clients($name: String, $first: Int!, $after: String) {
      clients(
        name: $name
        first: $first
        after: $after
        orderBy: "business_name ASC, first_name ASC, last_name ASC"
      ) {
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
  inputCodec: ConnectionQueryInput,
  outputCodec: ClientsQueryOutput
})

const ClientQueryInput = t.type(
  {
    id: PositiveInteger
  },
  'ClientQueryInput'
)

const ClientQueryOutput = t.type(
  {
    client: Client
  },
  'ClientQueryOutput'
)

export const clientQuery = makeQuery({
  query: gql`
    query client($id: Int!) {
      client(id: $id) {
        id
        type
        fiscal_code
        first_name
        last_name
        country_code
        vat_number
        business_name
        address_country
        address_province
        address_city
        address_zip
        address_street
        address_street_number
        address_email
        created_at
        updated_at
      }
    }
  `,
  inputCodec: ClientQueryInput,
  outputCodec: ClientQueryOutput
})

const CreateClientMutationInput = t.type(
  {
    client: ClientCreationInput
  },
  'CreateClientMutationInput'
)

const CreateClientMutationOutput = t.type(
  {
    createClient: Client
  },
  'CreateClientMutationOutput'
)

export const createClientMutation = makeMutation({
  query: gql`
    mutation createClient($client: ClientCreationInput!) {
      createClient(client: $client) {
        id
        type
        fiscal_code
        first_name
        last_name
        country_code
        vat_number
        business_name
        address_country
        address_province
        address_city
        address_zip
        address_street
        address_street_number
        address_email
        created_at
        updated_at
      }
    }
  `,
  inputCodec: CreateClientMutationInput,
  outputCodec: CreateClientMutationOutput
})

const UpdateClientMutationInput = t.type(
  {
    id: PositiveInteger,
    client: ClientCreationInput
  },
  'UpdateClientMutationInput'
)

const UpdateClientMutationOutput = t.type(
  {
    updateClient: Client
  },
  'UpdateClientMutationOutput'
)

export const updateClientMutation = makeMutation({
  query: gql`
    mutation updateClient($id: Int!, $client: ClientUpdateInput!) {
      updateClient(id: $id, client: $client) {
        id
        type
        fiscal_code
        first_name
        last_name
        country_code
        vat_number
        business_name
        address_country
        address_province
        address_city
        address_zip
        address_street
        address_street_number
        address_email
        created_at
        updated_at
      }
    }
  `,
  inputCodec: UpdateClientMutationInput,
  outputCodec: UpdateClientMutationOutput
})

const DeleteClientMutationInput = t.type(
  {
    id: PositiveInteger
  },
  'DeleteClientMutationInput'
)

const DeleteClientMutationOutput = t.type(
  {
    deleteClient: Client
  },
  'DeleteClientMutationOutput'
)

export const deleteClientMutation = makeMutation({
  query: gql`
    mutation deleteClient($id: Int!) {
      deleteClient(id: $id) {
        id
        type
        fiscal_code
        first_name
        last_name
        country_code
        vat_number
        business_name
        address_country
        address_province
        address_city
        address_zip
        address_street
        address_street_number
        address_email
        created_at
        updated_at
      }
    }
  `,
  inputCodec: DeleteClientMutationInput,
  outputCodec: DeleteClientMutationOutput
})
