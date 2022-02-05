import { either, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { a18n } from './a18n'
import { CoolerError, coolerError, foldCoolerErrorType } from './Types'
import { IO } from 'fp-ts/IO'
import { Context } from '../user/interface'
import { RequestHandler } from 'express'
import { sequenceS } from 'fp-ts/lib/Apply'
import { getContext } from '../getContext'

export const HttpMethod = t.keyof(
  {
    GET: true,
    POST: true,
    PUT: true,
    DELETE: true
  },
  'HttpMethod'
)
export type HttpMethod = t.TypeOf<typeof HttpMethod>

export function foldHttpMethod<T>(
  cases: Record<HttpMethod, IO<T>>
): Reader<HttpMethod, T> {
  return method => cases[method]()
}

export type Resolver<
  P extends t.Type<any> = t.Type<unknown>,
  Q extends t.Type<any> = t.Type<unknown>,
  B extends t.Type<any> = t.Type<unknown>,
  O extends t.Type<any> = t.Type<unknown>
> = RequestHandler<t.OutputOf<P>, t.TypeOf<O>, t.OutputOf<B>, t.OutputOf<Q>>

type Resolve<
  P extends t.Type<any> = t.Type<unknown>,
  Q extends t.Type<any> = t.Type<unknown>,
  B extends t.Type<any> = t.Type<unknown>,
  O extends t.Type<any> = t.Type<unknown>
> = (
  args: {
    params: t.TypeOf<P>
    query: t.TypeOf<Q>
    body: t.TypeOf<B>
  },
  context: Context
) => TaskEither<
  CoolerError,
  t.TypeOf<O> extends Option<any> ? never : t.TypeOf<O>
>

export function createResolver<
  P extends t.Type<any> = t.Type<unknown>,
  Q extends t.Type<any> = t.Type<unknown>,
  B extends t.Type<any> = t.Type<unknown>,
  O extends t.Type<any> = t.Type<unknown>
>(
  codecs: {
    params?: P
    query?: Q
    body?: B
    output: O
  },
  resolve: Resolve<P, Q, B, O>,
  resultStatus = 200
): Resolver<P, Q> {
  return (req, res) =>
    pipe(
      {
        params: codecs.params?.decode(req.params) ?? t.success(undefined),
        query: codecs.query?.decode(req.query) ?? t.success(undefined),
        body: codecs.body?.decode(req.body) ?? t.success(undefined)
      },
      sequenceS(either.either),
      either.mapLeft(error =>
        coolerError('COOLER_400', a18n`Invalid parameters format`, error)
      ),
      taskEither.fromEither,
      taskEither.chain(args =>
        pipe(
          taskEither.fromTask(() => getContext(req as any)),
          taskEither.mapLeft(error => {
            console.log(error)

            return coolerError(
              'COOLER_500',
              a18n`Failed to get the context of the request`
            )
          }),
          taskEither.chain(context => resolve(args, context))
        )
      ),
      taskEither => taskEither(),
      promise =>
        promise.then(
          either.fold(
            error => {
              const errorCode: number = pipe(
                error.code,
                foldCoolerErrorType({
                  COOLER_400: () => 400,
                  COOLER_401: () => 401,
                  COOLER_403: () => 403,
                  COOLER_404: () => 404,
                  COOLER_409: () => 409,
                  COOLER_500: () => 500
                })
              )

              return res.status(errorCode).json(error)
            },
            result => {
              return res
                .status(resultStatus)
                .json(pipe(result, codecs.output.encode))
            }
          )
        )
    )
}
