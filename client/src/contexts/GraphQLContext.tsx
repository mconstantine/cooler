import { either, readerTaskEither, taskEither } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import gql from 'graphql-tag'
import {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import { LocalizedString } from '../globalDomain'
import * as t from 'io-ts'
import { NonEmptyString } from 'io-ts-types'
import { commonErrors } from '../misc/commonErrors'
import { ErrorPanel } from '../components/ErrorPanel'
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
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { LoadingBlock } from '../components/Loading/LoadingBlock'

const introspectionQuery = gql`
  query introspection {
    __schema {
      queryType {
        fields {
          name
          type {
            name
          }
        }
      }
      mutationType {
        fields {
          name
          type {
            name
          }
        }
      }
    }
  }
`

const IntrospectionField = t.type(
  {
    name: NonEmptyString,
    type: t.type({
      name: NonEmptyString
    })
  },
  'IntrospectionField'
)

const IntrospectionSchemaType = t.type(
  {
    fields: t.array(IntrospectionField)
  },
  'IntrospectionSchemaType'
)

const IntrospectionSchema = t.type(
  {
    queryType: IntrospectionSchemaType,
    mutationType: IntrospectionSchemaType
  },
  'IntrospectionSchema'
)

const IntrospectionResponse = t.type(
  {
    data: t.type({
      __schema: IntrospectionSchema
    })
  },
  'IntrospectionResponse'
)
type IntrospectionResponse = t.TypeOf<typeof IntrospectionResponse>

interface GraphQLContext {
  sendGraphQLCall: <I, II, O, OO>(
    query: GraphQLCall<I, II, O, OO>,
    variables: I
  ) => TaskEither<ApiError, O>
}

const GraphQLContext = createContext<GraphQLContext>({
  sendGraphQLCall: readerTaskEither.fromIO(constVoid) as any
})

interface LoadingState {
  type: 'loading'
}

interface ErrorState {
  type: 'error'
  error: LocalizedString
}

interface ReadyState {
  type: 'ready'
  data: IntrospectionResponse
}

type State = LoadingState | ErrorState | ReadyState

function foldState<T>(
  whenLoading: IO<T>,
  whenError: Reader<LocalizedString, T>,
  whenReady: Reader<IntrospectionResponse, T>
): Reader<State, T> {
  return state => {
    switch (state.type) {
      case 'loading':
        return whenLoading()
      case 'error':
        return whenError(state.error)
      case 'ready':
        return whenReady(state.data)
    }
  }
}

export const GraphQLProvider: FC = props => {
  const { account, dispatch } = useAccount()
  const [state, setState] = useState<State>({ type: 'loading' })

  useEffect(() => {
    pipe(
      taskEither.tryCatch(
        () =>
          window.fetch(process.env.REACT_APP_API_URL!, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: introspectionQuery.loc!.source.body
            })
          }),
        () => setState({ type: 'error', error: commonErrors.unexpected })
      ),
      taskEither.chain(response =>
        taskEither.tryCatch(
          () => response.json(),
          () => setState({ type: 'error', error: commonErrors.unexpected })
        )
      ),
      taskEither.chain(
        flow(
          IntrospectionResponse.decode,
          reportDecodeErrors,
          taskEither.fromEither,
          taskEither.bimap(
            () => setState({ type: 'error', error: commonErrors.unexpected }),
            data => setState({ type: 'ready', data })
          )
        )
      )
    )()
  }, [])

  // TODO: this should cache stuff
  const sendGraphQLCall = useCallback(
    <I, II, O, OO>(
      query: GraphQLCall<I, II, O, OO>,
      variables: I
    ): TaskEither<ApiError, O> => {
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
    },
    [account, dispatch]
  )

  return (
    <GraphQLContext.Provider value={{ sendGraphQLCall }}>
      {pipe(
        state,
        foldState(
          () => <LoadingBlock />,
          error => <ErrorPanel error={error} />,
          () => props.children
        )
      )}
    </GraphQLContext.Provider>
  )
}

export function useGraphQL() {
  return useContext(GraphQLContext)
}
