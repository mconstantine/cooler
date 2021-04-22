import { either, readerTaskEither, taskEither } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { createContext, FC, useCallback, useContext } from 'react'
import { reportDecodeErrors } from '../misc/reportDecodeErrors'
import { foldAccount, useAccount } from './AccountContext'
import { TaskEither } from 'fp-ts/TaskEither'
import {
  GraphQLCall,
  ApiError,
  unexpectedApiError,
  RawApiErrors,
  extractApiError
} from '../misc/graphql'
import { OperationDefinitionNode } from 'graphql'
import gql from 'graphql-tag'
import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'

const refreshTokenQuery = gql`
  mutation refreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      expiration
    }
  }
`

const AccessTokenResponse = t.type(
  {
    accessToken: NonEmptyString,
    refreshToken: NonEmptyString,
    expiration: DateFromISOString
  },
  'AccessTokenResponse'
)

const RefreshTokenResponse = t.type(
  {
    refreshToken: AccessTokenResponse
  },
  'RefreshTokenResponse'
)

interface GraphQLContext {
  sendGraphQLCall: <I, II, O, OO>(
    query: GraphQLCall<I, II, O, OO>,
    variables: I
  ) => TaskEither<ApiError, O>
}

const GraphQLContext = createContext<GraphQLContext>({
  sendGraphQLCall: readerTaskEither.fromIO(constVoid) as any
})

export const GraphQLProvider: FC = props => {
  const { account, dispatch } = useAccount()

  const sendGraphQLCall = useCallback(
    <I, II, O, OO>(
      call: GraphQLCall<I, II, O, OO>,
      variables: I
    ): TaskEither<ApiError, O> => {
      return pipe(
        taskEither.tryCatch(
          () => {
            if (!call.query.loc) {
              throw new Error('sendGraphQLCall: found a query without source')
            }

            const definition = call.query.definitions.find(
              ({ kind }) => kind === 'OperationDefinition'
            ) as OperationDefinitionNode | undefined

            if (!definition) {
              throw new Error(
                'sendGraphQLCall: found a query with no operation definitions'
              )
            }

            const operationName = definition.name?.value ?? null

            return window.fetch(process.env.REACT_APP_API_URL!, {
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
                operationName,
                query: call.query.loc.source.body,
                variables: call.inputCodec.encode(variables)
              })
            })
          },
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
                  const failure = taskEither.left(error)

                  if (error.code === 'COOLER_403') {
                    return pipe(
                      account,
                      foldAccount(
                        () => failure,
                        ({ refreshToken }) =>
                          pipe(
                            taskEither.tryCatch(
                              () =>
                                window.fetch(process.env.REACT_APP_API_URL!, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({
                                    operationName: 'refreshToken',
                                    query: refreshTokenQuery.loc!.source.body,
                                    variables: { refreshToken }
                                  })
                                }),
                              () => error
                            ),
                            taskEither.chain(response =>
                              taskEither.tryCatch(
                                () => response.json(),
                                () => error
                              )
                            ),
                            taskEither.chain(response => {
                              if (response.data) {
                                return pipe(
                                  response.data,
                                  RefreshTokenResponse.decode,
                                  reportDecodeErrors,
                                  taskEither.fromEither,
                                  taskEither.mapLeft(() => error),
                                  taskEither.chain(({ refreshToken }) =>
                                    taskEither.fromIO(() =>
                                      dispatch({
                                        type: 'refresh',
                                        ...refreshToken
                                      })
                                    )
                                  )
                                )
                              } else {
                                return taskEither.fromIO(() =>
                                  dispatch({ type: 'logout' })
                                )
                              }
                            })
                          )
                      )
                    )
                  }

                  return failure
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
            call.outputCodec.decode,
            reportDecodeErrors,
            taskEither.fromEither,
            taskEither.mapLeft(() => unexpectedApiError)
          )
        )
      )
    },
    [account, dispatch]
  )

  return (
    <GraphQLContext.Provider value={{ sendGraphQLCall }}>
      {props.children}
    </GraphQLContext.Provider>
  )
}

export function useGraphQL() {
  return useContext(GraphQLContext)
}
