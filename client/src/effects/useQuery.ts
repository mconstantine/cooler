import {
  ApolloError,
  DocumentNode,
  QueryHookOptions,
  useQuery as useApolloQuery
} from '@apollo/client'
import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import * as t from 'io-ts'
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

interface LoadingQueryResult {
  state: 'loading'
}

interface ErrorQueryResult {
  state: 'error'
  error: ApolloError
}

interface SuccessQueryResult<Output> {
  state: 'success'
  data: Option<Output>
}

type QueryResult<Output> =
  | LoadingQueryResult
  | ErrorQueryResult
  | SuccessQueryResult<Output>

export function foldQuery<Output, T>(
  whenLoading: () => T,
  whenError: (error: ApolloError) => T,
  whenSuccess: (data: Option<Output>) => T
): (result: QueryResult<Output>) => T {
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

export function useQuery<Vars, EncodedVars, Output, EncodedOutput>(
  query: DocumentNode,
  options: TypedQueryHookOptions<Vars, Output>,
  varsCodec: t.Type<Vars, EncodedVars>,
  outputCodec: t.Type<Output, EncodedOutput>
): QueryResult<Output> {
  const { loading, error, data } = useApolloQuery(
    query,
    pipe(options, encodeQueryHookOptions(varsCodec, outputCodec))
  )

  if (loading) {
    return {
      state: 'loading'
    }
  } else if (error) {
    return {
      state: 'error',
      error
    }
  } else {
    return {
      state: 'success',
      data: pipe(
        data,
        outputCodec.decode,
        reportDecodeErrors,
        option.fromEither
      )
    }
  }
}
