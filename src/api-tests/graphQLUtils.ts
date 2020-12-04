import {
  ApolloClient,
  ApolloError,
  DocumentNode,
  gql,
  NormalizedCacheObject
} from '@apollo/client'
import { either, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Either } from 'fp-ts/Either'
import { TaskEither } from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { AccessTokenResponse } from '../user/interface'
import { reportDecodeErrors } from '../misc/reportDecodeErrors'

export function mutate<TO extends t.Mixed>(
  TO: TO,
  client: ApolloClient<any>,
  mutation: DocumentNode,
  accessToken?: string
): TaskEither<ApolloError, t.TypeOf<TO>> {
  return pipe(
    taskEither.tryCatch(
      () =>
        client.mutate<t.OutputOf<TO>, {}>({
          mutation,
          context: accessToken
            ? {
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
              }
            : undefined
        }),
      error => error as ApolloError
    ),
    taskEither.chain(result =>
      pipe(
        result.data,
        option.fromNullable,
        taskEither.fromOption(
          () =>
            new ApolloError({
              errorMessage: 'No data returned'
            })
        ),
        taskEither.chain(data =>
          taskEither.fromEither(
            pipe(
              TO.decode(data) as Either<t.Errors, t.TypeOf<TO>>,
              reportDecodeErrors(TO.name),
              either.mapLeft(
                () =>
                  new ApolloError({
                    errorMessage: 'Decoding failed'
                  })
              )
            )
          )
        )
      )
    )
  )
}

export function query<TO extends t.Mixed>(
  TO: TO,
  client: ApolloClient<any>,
  query: DocumentNode,
  accessToken?: string
): TaskEither<ApolloError, t.TypeOf<TO>> {
  return pipe(
    taskEither.tryCatch(
      () =>
        client.query<t.OutputOf<TO>, {}>({
          query: query,
          context: accessToken
            ? {
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
              }
            : undefined
        }),
      error => error as ApolloError
    ),
    taskEither.chain(result =>
      pipe(
        result.data,
        option.fromNullable,
        taskEither.fromOption(
          () =>
            new ApolloError({
              errorMessage: 'No data returned'
            })
        ),
        taskEither.chain(data =>
          taskEither.fromEither(
            pipe(
              TO.decode(data) as Either<t.Errors, t.TypeOf<TO>>,
              either.mapLeft(
                () =>
                  new ApolloError({
                    errorMessage: 'Decoding failed'
                  })
              )
            )
          )
        )
      )
    )
  )
}

export function loginUser(
  client: ApolloClient<NormalizedCacheObject>,
  email: string,
  password: string
): TaskEither<ApolloError, AccessTokenResponse> {
  return pipe(
    mutate(
      t.type({
        loginUser: AccessTokenResponse
      }),
      client,
      gql`
        mutation {
          loginUser(user: {
            email: "${email}"
            password: "${password}"
          }) {
            accessToken
            refreshToken
            expiration
          }
        }
      `
    ),
    taskEither.map(({ loginUser }) => loginUser)
  )
}
