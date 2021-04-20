import { taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { useCallback, useEffect, useState } from 'react'
import { ApiError, GraphQLQuery } from '../misc/graphql'
import { useGraphQL } from '../contexts/GraphQLContext'

interface LoadingQuery {
  type: 'loading'
}

interface FailedQuery {
  type: 'failed'
  error: ApiError
}

interface SuccessQuery<T> {
  type: 'success'
  data: T
}

type Query<T> = LoadingQuery | FailedQuery | SuccessQuery<T>

export function foldQuery<O, T>(
  whenLoading: Reader<void, T>,
  whenFailed: Reader<ApiError, T>,
  whenSuccess: Reader<O, T>
): Reader<Query<O>, T> {
  return query => {
    switch (query.type) {
      case 'loading':
        return whenLoading()
      case 'failed':
        return whenFailed(query.error)
      case 'success':
        return whenSuccess(query.data)
    }
  }
}

interface UpdateQueryFn<O> {
  (updateFn: (currentData: O) => O): void
}

export interface UseQueryOutput<I, O> {
  query: Query<O>
  refresh: Reader<I, void>
  update: UpdateQueryFn<O>
}

export function useQuery<I, II, O, OO>(
  query: GraphQLQuery<I, II, O, OO>,
  variables: I
): UseQueryOutput<I, O>
export function useQuery<II, O, OO>(
  query: GraphQLQuery<void, II, O, OO>,
  variables: void
): UseQueryOutput<void, O>
export function useQuery<I, II, O, OO>(
  query: GraphQLQuery<I, II, O, OO>,
  variables: I
): UseQueryOutput<I, O> {
  if (!query.query.loc) {
    throw new Error('Called useQuery with a query witout source')
  }

  const { sendGraphQLCall } = useGraphQL()
  const [state, setState] = useState<Query<O>>({ type: 'loading' })

  const refresh: Reader<I, void> = useCallback(
    variables => {
      setState({
        type: 'loading'
      })

      pipe(
        sendGraphQLCall(query, variables),
        taskEither.bimap(
          error =>
            setState({
              type: 'failed',
              error
            }),
          data =>
            setState({
              type: 'success',
              data
            })
        )
      )()
    },
    [sendGraphQLCall, query]
  )

  const update: UpdateQueryFn<O> = updateFn =>
    pipe(
      state,
      foldQuery(constVoid, constVoid, currentData =>
        setState({
          type: 'success',
          data: updateFn(currentData)
        })
      )
    )

  useEffect(() => {
    refresh(variables)
  }, [refresh, variables])

  return { query: state, refresh, update }
}
