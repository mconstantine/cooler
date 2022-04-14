import { UserContext, User, Context } from '../user/interface'
import { TaskEither } from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { boolean, taskEither } from 'fp-ts'
import { CoolerError, coolerError } from './Types'
import { a18n } from './a18n'
import { WithId } from 'mongodb'

export function ensureUser(
  context: Context
): TaskEither<CoolerError, WithId<User>> {
  return pipe(
    isUserContext(context),
    boolean.fold(
      () =>
        taskEither.left(
          coolerError(
            'COOLER_401',
            a18n`To continue, please authenticate and add a user access token to your request`
          )
        ),
      () => taskEither.right((context as UserContext).user)
    )
  )
}

export function isUserContext(context: Context): context is UserContext {
  return 'user' in context
}
