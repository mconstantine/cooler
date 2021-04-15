import { either, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import {
  ApiError,
  extractApiError,
  GraphQLMutation,
  RawApiErrors,
  unexpectedApiError
} from '../misc/graphql'
import { reportDecodeErrors } from '../misc/reportDecodeErrors'

export function useMutation<I, II, O, OO>(
  mutation: GraphQLMutation<I, II, O, OO>
): ReaderTaskEither<I, ApiError, O> {
  if (!mutation.query.loc) {
    throw new Error('Called useMutation with a mutation witout source')
  }

  return variables =>
    pipe(
      taskEither.tryCatch(
        () =>
          window.fetch(process.env.REACT_APP_API_URL!, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: mutation.query.loc!.source.body,
              variables: mutation.inputCodec.encode(variables)
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
        if (response.data) {
          return taskEither.right(response.data)
        } else if (response.errors) {
          return pipe(
            RawApiErrors.decode(response),
            reportDecodeErrors,
            either.fold(
              () => taskEither.left(unexpectedApiError),
              flow(extractApiError, taskEither.left)
            )
          )
        } else {
          return taskEither.left(unexpectedApiError)
        }
      }),
      taskEither.chain(
        flow(
          mutation.outputCodec.decode,
          reportDecodeErrors,
          taskEither.fromEither,
          taskEither.mapLeft(() => unexpectedApiError)
        )
      )
    )
}
