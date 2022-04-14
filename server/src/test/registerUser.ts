import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { WithId } from 'mongodb'
import { verifyToken } from '../misc/jsonWebToken'
import { CoolerError } from '../misc/Types'
import { getUserById } from '../user/database'
import { User, UserCreationInput } from '../user/interface'
import { createUser } from '../user/model'
import { testError } from './util'

export function registerUser(
  user: UserCreationInput,
  register?: WithId<User>
): TaskEither<CoolerError, WithId<User>> {
  return pipe(
    createUser(user, register ? { user: register } : {}),
    taskEither.map(({ accessToken }) => verifyToken(accessToken)),
    taskEither.chain(taskEither.fromOption(testError)),
    taskEither.chain(token => getUserById(token._id)),
    taskEither.chain(taskEither.fromOption(testError))
  )
}
