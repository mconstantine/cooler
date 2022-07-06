import { Option } from 'fp-ts/Option'
import * as t from 'io-ts'
import { NonEmptyString, optionFromNullable } from 'io-ts-types'
import {
  NonNegativeInteger,
  ObjectId,
  PositiveInteger,
  unsafeNonNegativeInteger
} from '../globalDomain'
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
      edges: t.array(Edge(T)),
      pageInfo: t.type(
        {
          totalCount: NonNegativeInteger,
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
  edges: Edge<T>[]
  pageInfo: {
    totalCount: NonNegativeInteger
    startCursor: Option<Cursor>
    endCursor: Option<Cursor>
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

const ConnectionQueryInputAsc = t.type(
  {
    query: optionFromNullable(NonEmptyString),
    first: PositiveInteger,
    after: optionFromNullable(Cursor)
  },
  'ConnectionQueryInputAsc'
)

const ConnectionQueryInputDesc = t.type(
  {
    query: optionFromNullable(NonEmptyString),
    last: PositiveInteger,
    before: optionFromNullable(Cursor)
  },
  'ConnectionQueryInputDesc'
)

export const ConnectionQueryInput = t.union(
  [ConnectionQueryInputAsc, ConnectionQueryInputDesc],
  'ConnectionQueryInput'
)
export type ConnectionQueryInput = t.TypeOf<typeof ConnectionQueryInput>

export function getConnectionNodes<T>(connection: Connection<T>): T[] {
  return connection.edges.map(edge => edge.node)
}

export function addToConnection<T extends { _id: ObjectId }>(
  connection: Connection<T>,
  newNode: T
): Connection<T> {
  return {
    ...connection,
    pageInfo: {
      ...connection.pageInfo,
      totalCount: unsafeNonNegativeInteger(connection.pageInfo.totalCount + 1)
    },
    edges: [
      {
        cursor: unsafeCursor(newNode._id),
        node: newNode
      },
      ...connection.edges
    ]
  }
}

export function updateConnection<T extends { _id: ObjectId }>(
  connection: Connection<T>,
  updatedNode: T
): Connection<T> {
  return {
    ...connection,
    edges: connection.edges.map(edge => ({
      ...edge,
      node: pipe(
        edge.node._id === updatedNode._id,
        boolean.fold(
          () => edge.node,
          () => updatedNode
        )
      )
    }))
  }
}

export function deleteFromConnection<T extends { _id: ObjectId }>(
  connection: Connection<T>,
  deletedNode: T
): Connection<T> {
  return {
    ...connection,
    pageInfo: {
      ...connection.pageInfo,
      totalCount: unsafeNonNegativeInteger(connection.pageInfo.totalCount - 1)
    },
    edges: connection.edges.filter(({ node }) => node._id !== deletedNode._id)
  }
}
