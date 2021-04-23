import { Reader } from 'fp-ts/Reader'
import { Option } from 'fp-ts/Option'
import { DocumentNode } from 'graphql'
import * as t from 'io-ts'
import { NonEmptyString, optionFromNullable } from 'io-ts-types'
import {
  LocalizedString,
  NonNegativeInteger,
  PositiveInteger,
  unsafeNonNegativeInteger
} from '../globalDomain'
import { IO } from 'fp-ts/IO'
import { Lazy, pipe } from 'fp-ts/function'
import { boolean, nonEmptyArray, option } from 'fp-ts'
import { commonErrors } from './commonErrors'

interface CursorBrand {
  readonly Cursor: unique symbol
}

export const Cursor = t.brand(
  t.string,
  (_): _ is t.Branded<string, CursorBrand> => true,
  'Cursor'
)
export type Cursor = t.TypeOf<typeof Cursor>

export function unsafeCursor(s: string): Cursor {
  return s as Cursor
}

export const Edge = <T extends t.Mixed>(T: T) =>
  t.type(
    {
      node: T,
      cursor: Cursor
    },
    `Edge<${T.name}>`
  )
export interface Edge<T> {
  node: T
  cursor: Cursor
}

export const Connection = <T extends t.Mixed>(T: T) =>
  t.type(
    {
      totalCount: NonNegativeInteger,
      edges: t.array(Edge(T)),
      pageInfo: t.type(
        {
          startCursor: optionFromNullable(Cursor),
          endCursor: optionFromNullable(Cursor),
          hasNextPage: t.boolean,
          hasPreviousPage: t.boolean
        },
        'PageInfo'
      )
    },
    `Connection<${T.name}>`
  )
export interface Connection<T> {
  totalCount: NonNegativeInteger
  edges: Edge<T>[]
  pageInfo: {
    startCursor: Option<Cursor>
    endCursor: Option<Cursor>
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export const ConnectionQueryInput = t.type(
  {
    name: optionFromNullable(NonEmptyString),
    first: PositiveInteger
  },
  'ConnectionQueryInput'
)
export type ConnectionQueryInput = t.TypeOf<typeof ConnectionQueryInput>

export function getConnectionNodes<T>(connection: Connection<T>): T[] {
  return connection.edges.map(edge => edge.node)
}

export function addToConnection<T extends { id: PositiveInteger }>(
  connection: Connection<T>,
  newNode: T
): Connection<T> {
  return {
    ...connection,
    totalCount: unsafeNonNegativeInteger(connection.totalCount + 1),
    edges: [
      {
        cursor: unsafeCursor(newNode.id.toString()),
        node: newNode
      },
      ...connection.edges
    ]
  }
}

export function updateConnection<T extends { id: PositiveInteger }>(
  connection: Connection<T>,
  updatedNode: T
): Connection<T> {
  return {
    ...connection,
    edges: connection.edges.map(edge => ({
      ...edge,
      node: pipe(
        edge.node.id === updatedNode.id,
        boolean.fold(
          () => edge.node,
          () => updatedNode
        )
      )
    }))
  }
}

export function deleteFromConnection<T extends { id: PositiveInteger }>(
  connection: Connection<T>,
  deletedNode: T
): Connection<T> {
  return {
    ...connection,
    totalCount: unsafeNonNegativeInteger(connection.totalCount - 1),
    edges: connection.edges.filter(({ node }) => node.id !== deletedNode.id)
  }
}

const CoolerErrorCode = t.keyof(
  {
    COOLER_400: true,
    COOLER_401: true,
    COOLER_403: true,
    COOLER_404: true,
    COOLER_409: true,
    COOLER_500: true
  },
  'CoolerErrorCode'
)
type CoolerErrorCode = t.TypeOf<typeof CoolerErrorCode>

export function foldCoolerErrorType<T>(
  matches: { [k in CoolerErrorCode]: IO<T> }
): Reader<CoolerErrorCode, T> {
  return code => matches[code]()
}

export function foldPartialCoolerErrorCode<T>(
  matches: Partial<{ [k in CoolerErrorCode]: IO<T> }>,
  defaultValue: Lazy<T>
): Reader<CoolerErrorCode, T> {
  return code => matches[code]?.() ?? defaultValue()
}

export const RawApiError = t.type(
  {
    extensions: t.type({
      code: CoolerErrorCode
    }),
    message: LocalizedString
  },
  'RawApiError'
)
export type RawApiError = t.TypeOf<typeof RawApiError>

export const RawApiErrors = t.type(
  {
    errors: t.array(RawApiError)
  },
  'RawApiErrors'
)
export type RawApiErrors = t.TypeOf<typeof RawApiErrors>

export interface ApiError {
  code: CoolerErrorCode
  message: LocalizedString
}

export const unexpectedApiError: ApiError = {
  code: 'COOLER_500',
  message: commonErrors.unexpected
}

export function rawToApiError(error: RawApiError): ApiError {
  return {
    code: error.extensions.code,
    message: error.message
  }
}

export function extractApiError(errors: RawApiErrors): ApiError {
  return pipe(
    errors.errors,
    nonEmptyArray.fromArray,
    option.fold(
      () => unexpectedApiError,
      ([error]) => rawToApiError(error)
    )
  )
}

export interface GraphQLQuery<I, II, O, OO> {
  type: 'query'
  query: DocumentNode
  inputCodec: t.Type<I, II>
  outputCodec: t.Type<O, OO>
}

export interface GraphQLMutation<I, II, O, OO> {
  type: 'mutation'
  query: DocumentNode
  inputCodec: t.Type<I, II>
  outputCodec: t.Type<O, OO>
}

export interface GraphQLCallImplementation<T> {
  query: string
  variables: T
}

export type GraphQLCall<I, II, O, OO> =
  | GraphQLQuery<I, II, O, OO>
  | GraphQLMutation<I, II, O, OO>

export function foldGraphQLCall<I, II, O, OO, T>(
  whenQuery: Reader<GraphQLQuery<I, II, O, OO>, T>,
  whenMutation: Reader<GraphQLMutation<I, II, O, OO>, T>
): Reader<GraphQLCall<I, II, O, OO>, T> {
  return call => {
    switch (call.type) {
      case 'query':
        return whenQuery(call)
      case 'mutation':
        return whenMutation(call)
    }
  }
}

export function makeQuery<I, II, O, OO>(
  query: Omit<GraphQLQuery<I, II, O, OO>, 'type'>
): GraphQLQuery<I, II, O, OO> {
  return {
    type: 'query',
    ...query
  }
}

export function makeMutation<I, II, O, OO>(
  query: Omit<GraphQLMutation<I, II, O, OO>, 'type'>
): GraphQLMutation<I, II, O, OO> {
  return {
    type: 'mutation',
    ...query
  }
}
