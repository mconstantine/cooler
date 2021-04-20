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
