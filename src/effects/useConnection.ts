import * as t from 'io-ts'
import { boolean, option } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyString } from 'io-ts-types'
import { useEffect, useState } from 'react'
import { query } from '../effects/api/api'
import { Query } from '../effects/api/Query'
import { GetRequest, useGet } from '../effects/api/useApi'
import { LocalizedString, unsafePositiveInteger } from '../globalDomain'
import {
  Connection,
  ConnectionC,
  ConnectionQueryInput
} from '../misc/Connection'

type ConnectionRequest<
  T extends t.Mixed,
  C extends ConnectionC<T>
> = GetRequest<
  t.TypeOf<typeof ConnectionQueryInput>,
  t.OutputOf<typeof ConnectionQueryInput>,
  t.TypeOf<C>,
  t.OutputOf<C>
>

interface UseConnectionHookOutput<T extends t.Mixed> {
  results: Query<LocalizedString, Connection<t.TypeOf<T>>>
  onSearchQueryChange: Reader<string, void>
  onLoadMore: IO<void>
}

export function useConnection<T extends t.Mixed, C extends ConnectionC<T>>(
  request: ConnectionRequest<T, C>
): UseConnectionHookOutput<T> {
  const [input, setInput] = useState<ConnectionQueryInput>({
    query: option.none,
    first: unsafePositiveInteger(20),
    after: option.none
  })

  const [connection] = useGet(request, input)

  const [results, setResults] = useState<Query<LocalizedString, Connection<T>>>(
    query.loading
  )

  const onSearchQueryChange: Reader<string, void> = flow(
    NonEmptyString.decode,
    option.fromEither,
    query => setInput({ ...input, query })
  )

  const onLoadMore: IO<void> = () => {
    pipe(
      connection,
      query.map(connection =>
        query.fromIO(() =>
          pipe(
            connection.pageInfo.hasNextPage,
            boolean.fold(constVoid, () =>
              pipe(
                connection.pageInfo.endCursor,
                option.fold(constVoid, endCursor =>
                  setInput(input => ({
                    ...input,
                    after: option.some(endCursor)
                  }))
                )
              )
            )
          )
        )
      )
    )
  }

  useEffect(() => {
    pipe(
      connection,
      query.chain(cursor =>
        query.fromIO(() =>
          setResults(results =>
            cursor.pageInfo.hasPreviousPage
              ? pipe(
                  results,
                  query.map(results => ({
                    pageInfo: cursor.pageInfo,
                    edges: [...results.edges, ...cursor.edges]
                  }))
                )
              : connection
          )
        )
      )
    )
  }, [connection])

  return { results, onSearchQueryChange, onLoadMore }
}
