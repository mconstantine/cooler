import { either } from 'fp-ts'
import { Either } from 'fp-ts/Either'
import { Reader } from 'fp-ts/Reader'
import { Option } from 'fp-ts/Option'
import * as t from 'io-ts'
import { optionFromNullable } from 'io-ts-types'
import { a18n } from './a18n'
import { coolerError, CoolerError, NonNegativeInteger } from './Types'

export const Edge = <T extends t.Mixed>(T: T) =>
  t.type(
    {
      node: T,
      cursor: NonNegativeInteger
    },
    `Edge<${T.name}>`
  )
export interface Edge<T> {
  node: T
  cursor: NonNegativeInteger
}

export const Connection = <T extends t.Mixed>(T: T) =>
  t.type(
    {
      totalCount: NonNegativeInteger,
      edges: t.array(Edge(T)),
      pageInfo: t.type(
        {
          startCursor: optionFromNullable(NonNegativeInteger),
          endCursor: optionFromNullable(NonNegativeInteger),
          hasNextPage: t.boolean,
          hasPreviousPage: t.boolean
        },
        'PageInfo'
      )
    },
    `Connection<${T.name}>`
  )

export function mapConnection<I, O>(
  op: Reader<I, O>
): Reader<Connection<I>, Connection<O>> {
  return connection => ({
    ...connection,
    edges: connection.edges.map(edge => ({
      ...edge,
      node: op(edge.node)
    }))
  })
}

export function swapConnectionNodes<I, O>(
  connection: Connection<I>,
  nodes: O[]
): Either<CoolerError, Connection<O>> {
  if (connection.edges.length !== nodes.length) {
    return either.left(
      coolerError(
        'COOLER_500',
        a18n`Trying to swap nodes of a connection with different length`
      )
    )
  }

  return either.right({
    ...connection,
    edges: connection.edges.map((edge, i) => ({
      ...edge,
      node: nodes[i]
    }))
  })
}

export interface Connection<T> {
  totalCount: NonNegativeInteger
  edges: Edge<T>[]
  pageInfo: {
    startCursor: Option<NonNegativeInteger>
    endCursor: Option<NonNegativeInteger>
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
