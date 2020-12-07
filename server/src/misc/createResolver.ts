import { ApolloError } from 'apollo-server-express'
import { either, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { Context } from '../user/interface'
import { a18n } from './a18n'
import { coolerError } from './Types'

export function createResolver<
  P,
  TI extends t.Type<any> = t.Type<any>,
  TO extends t.Type<any> = t.Type<any>,
  C = Context
>(
  argsCodec: TI,
  resultCodec: TO,
  resolve: (
    parent: P,
    args: t.TypeOf<TI>,
    context: C
  ) => TaskEither<
    ApolloError,
    t.TypeOf<TO> extends Option<any> ? never : t.TypeOf<TO>
  >
): (parent: P, args: t.OutputOf<TI>, context: C) => Promise<t.OutputOf<TO>> {
  return (parent, args, context) =>
    pipe(
      args,
      argsCodec.decode,
      either.mapLeft(error =>
        coolerError('COOLER_400', a18n`Invalid parameters format`, error)
      ),
      taskEither.fromEither,
      taskEither.chain((args: t.TypeOf<TI>) => resolve(parent, args, context)),
      taskEither => taskEither(),
      promise =>
        promise.then(
          either.fold(
            error => Promise.reject(error),
            result => Promise.resolve(pipe(result, resultCodec.encode))
          )
        )
    )
}
