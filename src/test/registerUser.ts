import { ApolloError } from 'apollo-server-express'
import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/lib/pipeable'
import { TaskEither } from 'fp-ts/lib/TaskEither'
import { verifyToken } from '../misc/jsonWebToken'
import { getUserById } from '../user/database'
import { User, UserCreationInput } from '../user/interface'
import { createUser } from '../user/model'
import { testError } from './util'

export function registerUser(
  user: UserCreationInput,
  register?: User
): TaskEither<ApolloError, User> {
  return pipe(
    createUser(user, register ? { user: register } : {}),
    taskEither.map(({ accessToken }) => verifyToken(accessToken)),
    taskEither.chain(taskEither.fromOption(testError)),
    taskEither.chain(token => getUserById(token.id)),
    taskEither.chain(taskEither.fromOption(testError))
  )
}
