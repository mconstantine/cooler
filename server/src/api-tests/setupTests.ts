import { TaskEither } from 'fp-ts/TaskEither'
import { startServer } from '../startServer'
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject
} from '@apollo/client'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import fetch from 'node-fetch'

let closeServer: TaskEither<Error, void>

export function startServerAndGetClient(): TaskEither<
  Error,
  ApolloClient<NormalizedCacheObject>
> {
  return pipe(
    startServer(),
    taskEither.bimap(
      error => error as Error,
      _closeServer => {
        closeServer = _closeServer

        return new ApolloClient({
          link: new HttpLink({
            uri: `http://localhost:${process.env.SERVER_PORT}/graphql`,
            fetch
          }),
          cache: new InMemoryCache()
        })
      }
    )
  )
}

export function stopServer(): TaskEither<Error, void> {
  return closeServer
}
