import { Option } from 'fp-ts/Option'
import * as t from 'io-ts'
import { NonEmptyString, optionFromNullable } from 'io-ts-types'
import { NonNegativeInteger } from '../globalDomain'

export const Edge = <T extends t.Mixed>(T: T) =>
  t.type(
    {
      node: T,
      cursor: NonEmptyString
    },
    `Edge<${T.name}>`
  )
export interface Edge<T> {
  node: T
  cursor: NonEmptyString
}

export const Connection = <T extends t.Mixed>(T: T) =>
  t.type(
    {
      totalCount: NonNegativeInteger,
      edges: t.array(Edge(T)),
      pageInfo: t.type(
        {
          startCursor: optionFromNullable(NonEmptyString),
          endCursor: optionFromNullable(NonEmptyString),
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
    startCursor: Option<NonEmptyString>
    endCursor: Option<NonEmptyString>
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function getConnectionNodes<T>(connection: Connection<T>): T[] {
  return connection.edges.map(edge => edge.node)
}
