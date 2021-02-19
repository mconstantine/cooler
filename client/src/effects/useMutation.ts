import {
  ApolloCache,
  ApolloError,
  DocumentNode,
  FetchResult,
  MutationFunctionOptions,
  MutationHookOptions,
  MutationResult as ApolloMutationResult,
  MutationTuple,
  MutationUpdaterFn,
  useMutation as useApolloMutation
} from '@apollo/client'
import { option, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { Option } from 'fp-ts/Option'
import * as t from 'io-ts'
import { reportDecodeErrors } from '../misc/reportDecodeErrors'

interface TypedMutationHookOptions<Vars, EncodedVars, Output, EncodedOutput>
  extends Omit<
    MutationHookOptions<EncodedOutput, EncodedVars>,
    'mutation' | 'variables' | 'optimisticResponse' | 'onCompleted' | 'update'
  > {
  mutation: DocumentNode
  variables: Vars
  optimisticResponse?: Output | ((vars: Vars) => Output)
  update?: TypedMutationUpdaterFn<Output, EncodedOutput>
  onCompleted?: (data: Option<Output>) => void
}

function encodeMutationHookOptions<Vars, EncodedVars, Output, EncodedOutput>(
  varsCodec: t.Type<Vars, EncodedVars>,
  outputCodec: t.Type<Output, EncodedOutput>
): (
  options: TypedMutationHookOptions<Vars, EncodedVars, Output, EncodedOutput>
) => MutationHookOptions<EncodedOutput, EncodedVars> {
  return options => ({
    ...options,
    variables: varsCodec.encode(options.variables),
    optimisticResponse: pipe(
      options.optimisticResponse,
      encodeOptimisticResponse(varsCodec, outputCodec)
    ),
    update: pipe(options.update, encodeMutationUpdaterFn(outputCodec)),
    onCompleted: pipe(
      options.onCompleted,
      option.fromNullable,
      option.map(onCompleted => (output: EncodedOutput) =>
        pipe(output, outputCodec.decode, option.fromEither, onCompleted)
      ),
      option.toUndefined
    )
  })
}

type TypedMutationUpdaterFn<Output, EncodedOutput> = (
  cache: ApolloCache<EncodedOutput>,
  mutationResult: FetchResult<Output>
) => void

interface TypedMutationFunctionOptions<Vars, EncodedVars, Output, EncodedOutput>
  extends Omit<
    MutationFunctionOptions<EncodedOutput, EncodedVars>,
    'variables' | 'optimisticResponse' | 'update'
  > {
  variables: Vars
  optimisticResponse?: Output | ((vars: Vars) => Output)
  update?: TypedMutationUpdaterFn<Output, EncodedOutput>
}

function encodeOptimisticResponse<Vars, EncodedVars, Output, EncodedOutput>(
  varsCodec: t.Type<Vars, EncodedVars>,
  outputCodec: t.Type<Output, EncodedOutput>
): (
  optimisticResponse: Output | ((vars: Vars) => Output) | undefined
) => EncodedOutput | ((vars: EncodedVars) => EncodedOutput) | undefined {
  return response => {
    if (!response) {
      return undefined
    } else if (typeof response === 'function') {
      return flow(
        varsCodec.decode,
        option.fromEither,
        option.fold(() => {
          throw new Error(
            'Called an optimistic response with malformed variables'
          )
        }, flow(response as (vars: Vars) => Output, outputCodec.encode))
      )
    } else {
      return outputCodec.encode(response)
    }
  }
}

function encodeMutationUpdaterFn<Output, EncodedOutput>(
  outputCodec: t.Type<Output, EncodedOutput>
): (
  update?: TypedMutationUpdaterFn<Output, EncodedOutput>
) => MutationUpdaterFn<EncodedOutput> | undefined {
  return flow(
    option.fromNullable,
    option.map(
      update => (
        cache: ApolloCache<EncodedOutput>,
        result: FetchResult<EncodedOutput>
      ) =>
        update(cache, {
          ...result,
          data: pipe(
            result.data,
            option.fromNullable,
            option.chain(flow(outputCodec.decode, option.fromEither)),
            option.toUndefined
          )
        })
    ),
    option.toUndefined
  )
}

function encodeMutationFunctionOptions<
  Vars,
  EncodedVars,
  Output,
  EncodedOutput
>(
  varsCodec: t.Type<Vars, EncodedVars>,
  outputCodec: t.Type<Output, EncodedOutput>
): (
  options: TypedMutationFunctionOptions<
    Vars,
    EncodedVars,
    Output,
    EncodedOutput
  >
) => MutationFunctionOptions<EncodedOutput, EncodedVars> {
  return options => ({
    ...options,
    variables: varsCodec.encode(options.variables),
    optimisticResponse: pipe(
      options.optimisticResponse,
      encodeOptimisticResponse(varsCodec, outputCodec)
    ),
    update: pipe(options.update, encodeMutationUpdaterFn(outputCodec))
  })
}

function decodeFetchResult<Output, EncodedOutput>(
  outputCodec: t.Type<Output, EncodedOutput>
): (result: FetchResult<EncodedOutput>) => Option<Output> {
  return result =>
    pipe(result.data, outputCodec.decode, reportDecodeErrors, option.fromEither)
}

interface IdleMutationResult<EncodedOutput>
  extends Omit<
    ApolloMutationResult<EncodedOutput>,
    'data' | 'error' | 'loading'
  > {
  state: 'idle'
  data: Option<never>
}

interface LoadingMutationResult<EncodedOutput>
  extends Omit<
    ApolloMutationResult<EncodedOutput>,
    'data' | 'error' | 'loading'
  > {
  state: 'loading'
  data: Option<never>
}

interface SuccessMutationResult<Output, EncodedOutput>
  extends Omit<
    ApolloMutationResult<EncodedOutput>,
    'data' | 'error' | 'loading'
  > {
  state: 'success'
  data: Option<Output>
}

interface ErrorMutationResult<EncodedOutput>
  extends Omit<
    ApolloMutationResult<EncodedOutput>,
    'data' | 'error' | 'loading'
  > {
  state: 'error'
  error: ApolloError
  data: Option<never>
}

export type MutationResult<Output, EncodedOutput> =
  | IdleMutationResult<EncodedOutput>
  | LoadingMutationResult<EncodedOutput>
  | SuccessMutationResult<Output, EncodedOutput>
  | ErrorMutationResult<EncodedOutput>

export function foldMutationResult<Output, EncodedOutput, T>(
  whenIdle: (result: IdleMutationResult<EncodedOutput>) => T,
  whenLoading: (result: LoadingMutationResult<EncodedOutput>) => T,
  whenError: (result: ErrorMutationResult<EncodedOutput>) => T,
  whenSuccess: (result: SuccessMutationResult<Output, EncodedOutput>) => T
): (result: MutationResult<Output, EncodedOutput>) => T {
  return result => {
    switch (result.state) {
      case 'idle':
        return whenIdle(result)
      case 'loading':
        return whenLoading(result)
      case 'error':
        return whenError(result)
      case 'success':
        return whenSuccess(result)
    }
  }
}

function decodeMutationResult<Output, EncodedOutput>(
  outputCodec: t.Type<Output, EncodedOutput>
): (
  result: ApolloMutationResult<EncodedOutput>
) => MutationResult<Output, EncodedOutput> {
  return result => {
    if (!result.called) {
      return {
        state: 'idle',
        ...result,
        data: option.none
      }
    } else if (result.loading) {
      return {
        state: 'loading',
        ...result,
        data: option.none
      }
    } else if (result.error) {
      return {
        state: 'error',
        ...result,
        error: result.error,
        data: option.none
      }
    } else {
      return {
        state: 'success',
        ...result,
        data: pipe(
          outputCodec.decode(result.data),
          reportDecodeErrors,
          option.fromEither
        )
      }
    }
  }
}

type TypedMutationTuple<Vars, EncodedVars, Output, EncodedOutput> = [
  (
    options: TypedMutationFunctionOptions<
      Vars,
      EncodedVars,
      Output,
      EncodedOutput
    >
  ) => TaskEither<ApolloError, Option<Output>>,
  MutationResult<Output, EncodedOutput>
]

function decodeMutationTuple<Vars, EncodedVars, Output, EncodedOutput>(
  varsCodec: t.Type<Vars, EncodedVars>,
  outputCodec: t.Type<Output, EncodedOutput>
): (
  tuple: MutationTuple<EncodedOutput, EncodedVars>
) => TypedMutationTuple<Vars, EncodedVars, Output, EncodedOutput> {
  return tuple => {
    const [command, result] = tuple

    return [
      flow(
        encodeMutationFunctionOptions(varsCodec, outputCodec),
        options =>
          taskEither.tryCatch(
            () => command(options),
            error => error as ApolloError
          ),
        taskEither.map(decodeFetchResult(outputCodec))
      ),
      pipe(result, decodeMutationResult(outputCodec))
    ]
  }
}

interface Mutation<Vars, EncodedVars, Output, EncodedOutput> {
  mutation: DocumentNode
  varsCodec: t.Type<Vars, EncodedVars>
  outputCodec: t.Type<Output, EncodedOutput>
}

export function createMutation<Vars, EncodedVars, Output, EncodedOutput>(
  mutation: DocumentNode,
  varsCodec: t.Type<Vars, EncodedVars>,
  outputCodec: t.Type<Output, EncodedOutput>
): Mutation<Vars, EncodedVars, Output, EncodedOutput> {
  return { mutation, varsCodec, outputCodec }
}

export function useMutation<Vars, EncodedVars, Output, EncodedOutput>(
  mutation: Mutation<Vars, EncodedVars, Output, EncodedOutput>,
  options: Option<
    TypedMutationHookOptions<Vars, EncodedVars, Output, EncodedOutput>
  >
): TypedMutationTuple<Vars, EncodedVars, Output, EncodedOutput> {
  const tuple = useApolloMutation(
    mutation.mutation,
    pipe(
      options,
      option.map(
        encodeMutationHookOptions(mutation.varsCodec, mutation.outputCodec)
      ),
      option.toUndefined
    )
  )

  return pipe(
    tuple,
    decodeMutationTuple(mutation.varsCodec, mutation.outputCodec)
  )
}
