import { Reader } from 'fp-ts/Reader'
import { Option } from 'fp-ts/Option'
import { DocumentNode } from 'graphql'
import * as t from 'io-ts'
import { NonEmptyString, optionFromNullable } from 'io-ts-types'
import { LocalizedString, NonNegativeInteger } from '../globalDomain'
import { IO } from 'fp-ts/IO'
import { flow, Lazy, pipe } from 'fp-ts/function'
import { either, nonEmptyArray, option, taskEither } from 'fp-ts'
import { commonErrors } from './commonErrors'
import { AccountContext, foldAccount } from '../contexts/AccountContext'
import { reportDecodeErrors } from './reportDecodeErrors'
import { TaskEither } from 'fp-ts/TaskEither'

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

export function sendGraphQLCall<I, II, O, OO>(
  { account, dispatch }: AccountContext,
  query: GraphQLCall<I, II, O, OO>,
  variables: I
): TaskEither<ApiError, O> {
  return pipe(
    taskEither.tryCatch(
      () =>
        window.fetch(process.env.REACT_APP_API_URL!, {
          method: 'POST',
          headers: {
            ...{ 'Content-Type': 'application/json' },
            ...pipe(
              account,
              foldAccount(
                () => ({}),
                ({ accessToken }) => ({
                  Authorization: `Bearer ${accessToken}`
                })
              )
            )
          },
          body: JSON.stringify({
            query: query.query.loc!.source.body,
            variables: query.inputCodec.encode(variables)
          })
        }),
      () => unexpectedApiError
    ),
    taskEither.chain(response =>
      taskEither.tryCatch(
        () => response.json(),
        () => unexpectedApiError
      )
    ),
    taskEither.chain(response => {
      if (response.errors) {
        return pipe(
          RawApiErrors.decode(response),
          reportDecodeErrors,
          either.fold(
            () => taskEither.left(unexpectedApiError),
            flow(extractApiError, error => {
              if (error.code === 'COOLER_403') {
                // TODO: try refreshing the token
                dispatch({ type: 'logout' })
              }

              return taskEither.left(error)
            })
          )
        )
      } else if (response.data) {
        return taskEither.right(response.data)
      } else {
        return taskEither.left(unexpectedApiError)
      }
    }),
    taskEither.chain(
      flow(
        query.outputCodec.decode,
        reportDecodeErrors,
        taskEither.fromEither,
        taskEither.mapLeft(() => unexpectedApiError)
      )
    )
  )
}
