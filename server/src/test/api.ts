import { TaskEither } from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { coolerError, CoolerError } from '../misc/Types'
import fetch from 'isomorphic-fetch'
import { pipe } from 'fp-ts/function'
import { either, taskEither } from 'fp-ts'
import { AccessTokenResponse } from '../user/interface'
import { unsafeLocalizedString } from '../misc/a18n'
import { reportDecodeErrors } from '../misc/reportDecodeErrors'

const serverPort = process.env.SERVER_PORT

if (!serverPort) {
  throw new Error('SERVER_PORT not found in environment file.')
}

const apiUrl = `http://localhost:${serverPort}`

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface Request<I, II, O, OO> {
  path: string
  input?: I
  inputCodec: t.Type<I, II>
  outputCodec: t.Type<O, OO>
}

interface GetRequest<I, II, O, OO> extends Request<I, II, O, OO> {
  method: 'GET'
}

interface PostRequest<I, II, O, OO> extends Request<I, II, O, OO> {
  method: 'POST'
}

interface PutRequest<I, II, O, OO> extends Request<I, II, O, OO> {
  method: 'PUT'
}

interface DeleteRequest<I, II, O, OO> extends Request<I, II, O, OO> {
  method: 'DELETE'
}

export function makeGetRequest<I, II, O, OO>(
  args: Request<I, II, O, OO>
): GetRequest<I, II, O, OO> {
  return {
    ...args,
    method: 'GET'
  }
}

export function makePostRequest<I, II, O, OO>(
  args: Request<I, II, O, OO>
): PostRequest<I, II, O, OO> {
  return {
    ...args,
    method: 'POST'
  }
}

export function makePutRequest<I, II, O, OO>(
  args: Request<I, II, O, OO>
): PutRequest<I, II, O, OO> {
  return {
    ...args,
    method: 'PUT'
  }
}

export function makeDeleteRequest<I, II, O, OO>(
  args: Request<I, II, O, OO>
): DeleteRequest<I, II, O, OO> {
  return {
    ...args,
    method: 'DELETE'
  }
}

export function sendRequest<I, II, O, OO>(
  request: Request<I, II, O, OO> & { method: HttpMethod },
  authorization?: AccessTokenResponse
): TaskEither<CoolerError, O> {
  const isQueryRequest = request.method === 'GET' || request.method === 'DELETE'
  const isBodyRequest = request.method === 'POST' || request.method === 'PUT'

  const query =
    isQueryRequest && request.input
      ? '?' +
        Object.entries(request.inputCodec.encode(request.input))
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
      : ''

  const body =
    isBodyRequest && request.input
      ? JSON.stringify(request.inputCodec.encode(request.input))
      : undefined

  const url = `${apiUrl}${request.path}${query}`

  const headers = {
    'Content-Type': 'application/json',
    ...(authorization
      ? {
          Authorization: `Bearer ${authorization.accessToken}`
        }
      : {})
  }

  return pipe(
    taskEither.tryCatch(
      () =>
        fetch(url, {
          method: request.method,
          headers,
          body
        }),
      () =>
        coolerError(
          'COOLER_500',
          unsafeLocalizedString(`failed to send request: ${url}`)
        )
    ),
    taskEither.chain(response =>
      taskEither.tryCatch(
        // @ts-ignore
        () => response.json(),
        () =>
          coolerError(
            'COOLER_500',
            unsafeLocalizedString(`failed to parse response to JSON: ${url}`)
          )
      )
    ),
    taskEither.chain(data =>
      pipe(
        request.outputCodec.decode(data),
        either.orElse<t.Errors, O, CoolerError>(errors =>
          pipe(
            CoolerError.decode(data),
            either.mapLeft(() => {
              reportDecodeErrors(url)(either.left(errors))

              return coolerError(
                'COOLER_500',
                unsafeLocalizedString(`failed to decode response: ${url}`)
              )
            }),
            either.chain(either.left)
          )
        ),
        taskEither.fromEither
      )
    )
  )
}
