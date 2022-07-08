import * as t from 'io-ts'
import { TaskEither } from 'fp-ts/TaskEither'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { either, option, readerTaskEither, taskEither } from 'fp-ts'
import { pipe, flow } from 'fp-ts/function'
import { reportErrors } from './reportErrors'
import { useEffect, useMemo, useState } from 'react'
import { query } from './api'
import { Query } from './Query'
import { Option } from 'fp-ts/Option'
import { LocalizedString } from '../../globalDomain'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { LoginOutput, useAccount } from '../../contexts/AccountContext'
import { a18n } from '../../a18n'

const API_URL = process.env['REACT_APP_API_URL']?.replace(/\/?$/, '')

if (!API_URL) {
  throw new Error('Environment does not contain REACT_APP_API_URL')
}

const HttpMethod = t.keyof({
  GET: true,
  POST: true,
  PUT: true,
  DELETE: true
})
type HttpMethod = t.TypeOf<typeof HttpMethod>

function foldHttpMethod<O>(
  cases: Record<HttpMethod, IO<O>>
): Reader<HttpMethod, O> {
  return method => cases[method]()
}

export interface Request<I, II, O, OO> {
  method: HttpMethod
  url: string
  inputCodec: t.Type<I, II>
  outputCodec: t.Type<O, OO>
}

export interface GetRequest<I, II, O, OO>
  extends Omit<Request<I, II, O, OO>, 'method'> {
  method: 'GET'
}
export function makeGetRequest<I, II, O, OO>(
  request: Omit<Request<I, II, O, OO>, 'method'>
): GetRequest<I, II, O, OO> {
  return { ...request, method: 'GET' }
}

interface PostRequest<I, II, O, OO>
  extends Omit<Request<I, II, O, OO>, 'method'> {
  method: 'POST'
}
export function makePostRequest<I, II, O, OO>(
  request: Omit<Request<I, II, O, OO>, 'method'>
): PostRequest<I, II, O, OO> {
  return { ...request, method: 'POST' }
}

interface PutRequest<I, II, O, OO>
  extends Omit<Request<I, II, O, OO>, 'method'> {
  method: 'PUT'
}
export function makePutRequest<I, II, O, OO>(
  request: Omit<Request<I, II, O, OO>, 'method'>
): PutRequest<I, II, O, OO> {
  return { ...request, method: 'PUT' }
}

interface DeleteRequest<I, II, O, OO>
  extends Omit<Request<I, II, O, OO>, 'method'> {
  method: 'DELETE'
}
export function makeDeleteRequest<I, II, O, OO>(
  request: Omit<Request<I, II, O, OO>, 'method'>
): DeleteRequest<I, II, O, OO> {
  return { ...request, method: 'DELETE' }
}

const ServerError = t.type(
  {
    status: t.number,
    message: LocalizedString
  },
  'ServerError'
)
type ServerError = t.TypeOf<typeof ServerError>

export function makeRequest<I, II, O, OO>(
  request: Request<I, II, O, OO>,
  token: Option<LoginOutput>,
  input?: I
): TaskEither<ServerError, O> {
  const createQuery: IO<string> = () => {
    if (input === undefined) {
      return ''
    }

    return pipe(
      input,
      request.inputCodec.encode,
      data =>
        '?' +
        Object.entries(data)
          .filter(([, value]) => value !== null)
          .map(([key, value]) => [
            encodeURIComponent(key),
            encodeURIComponent(value)
          ])
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
    )
  }

  const createBody: IO<string> = () => {
    if (input === undefined) {
      return ''
    }

    return pipe(input, request.inputCodec.encode, JSON.stringify)
  }

  const query = pipe(
    request.method,
    foldHttpMethod({
      GET: createQuery,
      POST: () => '',
      PUT: () => '',
      DELETE: createQuery
    })
  )

  return pipe(
    taskEither.tryCatch(
      () =>
        window.fetch(`${API_URL}${request.url}${query}`, {
          method: request.method,
          headers: {
            ...{
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            ...pipe(
              token,
              option.fold(
                () => ({}),
                token => ({ Authorization: `Bearer ${token.accessToken}` })
              )
            )
          },
          body: pipe(
            request.method,
            foldHttpMethod({
              GET: () => undefined,
              POST: createBody,
              PUT: createBody,
              DELETE: () => undefined
            })
          )
        }),
      error => {
        console.log(error)

        return {
          status: 500,
          message: a18n`Unable to fetch data from the server`
        }
      }
    ),
    taskEither.chain(response =>
      pipe(
        taskEither.tryCatch(
          () => response.json(),
          error => {
            console.log(error)

            return {
              status: 500,
              message: a18n`Unable to parse server response`
            }
          }
        ),
        taskEither.chain(data => {
          if (response.status > 299) {
            return pipe(
              ServerError.decode(data),
              either.mapLeft(() => ({
                status: 500,
                message: a18n`Unable to decode error response`
              })),
              taskEither.fromEither,
              taskEither.chain(taskEither.left)
            )
          }

          return taskEither.right(data)
        })
      )
    ),
    taskEither.chain(
      flow(
        request.outputCodec.decode,
        reportErrors,
        taskEither.fromEither,
        taskEither.mapLeft(() => ({
          status: 500,
          message: a18n`Decoding error from server response`
        }))
      )
    )
  )
}

export type QueryHookOutput<T> = [
  query: Query<LocalizedString, T>,
  reload: IO<void>
]

function useQuery<I, II, O, OO>(
  request: Request<I, II, O, OO>,
  input?: I
): QueryHookOutput<O> {
  const { withLogin } = useAccount()
  const [queryState, setQueryState] = useState<Query<LocalizedString, O>>(
    query.loading()
  )

  const makeSendRequest = (request: Request<I, II, O, OO>, input?: I) =>
    pipe(
      withLogin(request as Request<I | undefined, II, O, OO>, input),
      taskEither.bimap(
        flow(query.left, setQueryState),
        flow(query.right, setQueryState)
      )
    )

  const reloadQuery = (request: Request<I, II, O, OO>, input?: I) => {
    const sendRequest = makeSendRequest(request, input)

    setQueryState(query.loading())
    sendRequest()
  }

  useEffect(() => {
    reloadQuery(request, input)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input])

  return [queryState, () => reloadQuery(request, input)]
}

function useCommand<I, II, O, OO>(
  request: Request<I, II, O, OO>
): ReaderTaskEither<I, LocalizedString, O> {
  const { withLogin } = useAccount()
  return input => withLogin(request, input)
}

export function useGet<I, II, O, OO>(
  request: GetRequest<I, II, O, OO>,
  input?: I
) {
  return useQuery(request, input)
}

export function useLazyGet<I, II, O, OO>(request: GetRequest<I, II, O, OO>) {
  return useCommand(request)
}

export function useReactiveCommand<I, II, O, OO>(
  request: Request<I, II, O, OO>
): [
  query: Query<LocalizedString, O>,
  setter: Reader<O, void>,
  command: ReaderTaskEither<I, void, void>
] {
  const [state, setState] = useState<Query<LocalizedString, O>>(query.loading())
  const command = useCommand(request)
  const setter: Reader<O, void> = flow(query.right, setState)

  const commandHandler: ReaderTaskEither<I, void, void> = useMemo(
    () =>
      pipe(
        command,
        readerTaskEither.bimap(
          flow(query.left, setState),
          flow(query.right, setState)
        )
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return [state, setter, commandHandler]
}

export function usePost<I, II, O, OO>(request: PostRequest<I, II, O, OO>) {
  return useCommand(request)
}

export function usePut<I, II, O, OO>(request: PutRequest<I, II, O, OO>) {
  return useCommand(request)
}

export function useDelete<I, II, O, OO>(request: DeleteRequest<I, II, O, OO>) {
  return useCommand(request)
}
