import { Reader } from 'fp-ts/Reader'
import { Option } from 'fp-ts/Option'
import * as t from 'io-ts'
import { NonEmptyString, optionFromNullable } from 'io-ts-types'
import {
  NonNegativeInteger,
  PositiveInteger,
  unsafeNonNegativeInteger
} from '../globalDomain'
import { IO } from 'fp-ts/IO'
import { pipe } from 'fp-ts/function'
import { boolean } from 'fp-ts'

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
    first: PositiveInteger,
    after: optionFromNullable(Cursor)
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

export function foldCoolerErrorType<T>(matches: {
  [k in CoolerErrorCode]: IO<T>
}): Reader<CoolerErrorCode, T> {
  return code => matches[code]()
}
