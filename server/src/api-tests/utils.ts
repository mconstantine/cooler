import * as t from 'io-ts'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { taskEither } from 'fp-ts'
import { ReaderTaskEither } from 'fp-ts/lib/ReaderTaskEither'
import { pipe } from 'fp-ts/function'
import dotenv from 'dotenv'
import { AccessTokenResponse } from '../user/interface'
import { TaskEither } from 'fp-ts/TaskEither'
import { CoolerError } from '../misc/Types'

dotenv.config()
export const API_URL = `http://localhost:${process.env.SERVER_PORT}`

export function testRequest<T extends t.Mixed>(
  codec: T
): ReaderTaskEither<
  Promise<AxiosResponse<t.OutputOf<T>>>,
  AxiosError<CoolerError>,
  t.TypeOf<T>
> {
  return request =>
    pipe(
      taskEither.tryCatch(
        () => request,
        response => response as AxiosError<CoolerError>
      ),
      taskEither.chain(response =>
        pipe(
          codec.decode(response.data),
          taskEither.fromEither,
          taskEither.mapLeft(() => null as any)
        )
      )
    )
}

export function loginUser(
  email: string,
  password: string
): TaskEither<AxiosError<CoolerError>, AccessTokenResponse> {
  return pipe(
    axios.post(`${API_URL}/profile/login`, { email, password }),
    testRequest(AccessTokenResponse)
  )
}
