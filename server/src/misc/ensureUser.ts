import { UserContext, User, Context } from '../user/interface'
import { ApolloError } from 'apollo-server-express'
import { TaskEither } from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { boolean, taskEither } from 'fp-ts'
import { coolerError } from './Types'

export function ensureUser(context: Context): TaskEither<ApolloError, User> {
  return pipe(
    isUserContext(context),
    boolean.fold(
      () => taskEither.left(coolerError('COOLER_401', 'Unauthorized')),
      () => taskEither.right((context as UserContext).user)
    )
  )
}

export function isUserContext(context: Context): context is UserContext {
  return 'user' in context
}
