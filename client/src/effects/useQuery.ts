import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
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

type UseQueryOutput<I, O> = [Query<O>, Reader<I, void>, Reader<O, void>]

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

  const refresh: Reader<I | undefined, void> = useCallback(
    currentVariables => {
      setState({
        type: 'loading'
      })

      pipe(
        sendGraphQLCall(query, currentVariables || variables),
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
    [sendGraphQLCall, query, variables]
  )

  const update: Reader<O, void> = newData =>
    setState({
      type: 'success',
      data: newData
    })

  useEffect(() => {
    refresh(variables)
  }, [variables, refresh])

  return [state, refresh, update]
}
