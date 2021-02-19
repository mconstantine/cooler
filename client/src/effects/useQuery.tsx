import {
  ApolloError,
  DocumentNode,
  QueryHookOptions,
  QueryResult as ApolloQueryResult,
  useQuery as useApolloQuery
} from '@apollo/client'
import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { Option } from 'fp-ts/Option'
import * as t from 'io-ts'
import { ErrorPanel } from '../components/ErrorPanel'
import { LoadingBlock } from '../components/Loading/LoadingBlock'
import { commonErrors } from '../misc/commonErrors'
import { getGraphQLError } from '../misc/getGraphQLError'
import { reportDecodeErrors } from '../misc/reportDecodeErrors'

interface TypedQueryHookOptions<Vars, Output>
  extends Omit<QueryHookOptions<Output, Vars>, 'variables' | 'onCompleted'> {
  variables: Vars
  onCompleted?: (output: Option<Output>) => void
}

function encodeQueryHookOptions<Vars, EncodedVars, Output, EncodedOutput>(
  varsCodec: t.Type<Vars, EncodedVars>,
  outputCodec: t.Type<Output, EncodedOutput>
): (
  options: TypedQueryHookOptions<Vars, Output>
) => QueryHookOptions<EncodedOutput, EncodedVars> {
  return options => ({
    ...options,
    onCompleted: pipe(
      options.onCompleted,
      option.fromNullable,
      option.map(onCompleted => (output: EncodedOutput) =>
        pipe(output, outputCodec.decode, option.fromEither, onCompleted)
      ),
      option.toUndefined
    ),
    variables: varsCodec.encode(options.variables)
  })
}

interface LoadingQueryResult<EncodedOutput>
  extends Omit<ApolloQueryResult<EncodedOutput>, 'data'> {
  state: 'loading'
  data: Option<never>
}

interface ErrorQueryResult<EncodedOutput>
  extends Omit<ApolloQueryResult<EncodedOutput>, 'data'> {
  state: 'error'
  error: ApolloError
  data: Option<never>
}

interface SuccessQueryResult<Output, EncodedOutput>
  extends Omit<ApolloQueryResult<EncodedOutput>, 'data'> {
  state: 'success'
  data: Option<Output>
}

export type QueryResult<Output, EncodedOutput> =
  | LoadingQueryResult<EncodedOutput>
  | ErrorQueryResult<EncodedOutput>
  | SuccessQueryResult<Output, EncodedOutput>

export function foldQuery<Output, EncodedOutput, T>(
  whenLoading: IO<T>,
  whenError: Reader<ApolloError, T>,
  whenSuccess: Reader<Option<Output>, T>
): Reader<QueryResult<Output, EncodedOutput>, T> {
  return result => {
    switch (result.state) {
      case 'loading':
        return whenLoading()
      case 'error':
        return whenError(result.error)
      case 'success':
        return whenSuccess(result.data)
    }
  }
}

const defaultWhenLoading: IO<JSX.Element> = () => <LoadingBlock />

const defaultWhenError: Reader<ApolloError, JSX.Element> = error => (
  <ErrorPanel error={getGraphQLError(error)} />
)

const defaultWhenEmptyData: IO<JSX.Element> = () => (
  <ErrorPanel error={commonErrors.decode} />
)

export function foldQueryWithDefaults<Output, EncodedOutput>(
  whenSuccess: Reader<Output, JSX.Element | null>,
  whenLoading: IO<JSX.Element | null> = defaultWhenLoading,
  whenError: Reader<ApolloError, JSX.Element | null> = defaultWhenError,
  whenEmptyData: IO<JSX.Element | null> = defaultWhenEmptyData
): Reader<QueryResult<Output, EncodedOutput>, JSX.Element | null> {
  return foldQuery(
    whenLoading,
    whenError,
    option.fold(whenEmptyData, whenSuccess)
  )
}

export interface QueryImplementation<V extends t.Mixed, O extends t.Mixed> {
  query: DocumentNode
  varsCodec: V
  outputCodec: O
}

export function createQuery<V extends t.Mixed, O extends t.Mixed>(
  query: DocumentNode,
  varsCodec: V,
  outputCodec: O
): QueryImplementation<V, O> {
  return { query, varsCodec, outputCodec }
}

export function useQuery<V extends t.Mixed, O extends t.Mixed>(
  query: QueryImplementation<V, O>,
  options: TypedQueryHookOptions<t.TypeOf<V>, t.TypeOf<O>>
): QueryResult<t.TypeOf<O>, t.OutputOf<O>> {
  const result = useApolloQuery(
    query.query,
    pipe(options, encodeQueryHookOptions(query.varsCodec, query.outputCodec))
  )

  if (result.loading) {
    return {
      ...result,
      state: 'loading',
      data: option.none
    }
  } else if (result.error) {
    return {
      ...result,
      state: 'error',
      error: result.error,
      data: option.none
    }
  } else {
    return {
      ...result,
      state: 'success',
      data: pipe(
        result.data,
        query.outputCodec.decode,
        reportDecodeErrors,
        option.fromEither
      )
    }
  }
}
