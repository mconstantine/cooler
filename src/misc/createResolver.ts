import { ApolloError } from 'apollo-server-express'
import { either, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { coolerError } from './Types'

export function createResolver<P, C, S, D, R>(
  codec: t.Type<D, S>,
  resolve: (
    parent: P,
    args: D,
    context: C
  ) => TaskEither<ApolloError, R extends Option<any> ? never : R>
): (parent: P, args: S, context: C) => Promise<R> {
  return (parent, args, context) =>
    pipe(
      args,
      codec.decode,
      either.mapLeft(error =>
        coolerError('COOLER_400', 'Invalid parameters format', error)
      ),
      taskEither.fromEither,
      taskEither.chain(args => resolve(parent, args, context)),
      taskEither => taskEither(),
      promise =>
        promise.then(
          either.fold(
            error => Promise.reject(error),
            result => Promise.resolve(result)
          )
        )
    )
}
