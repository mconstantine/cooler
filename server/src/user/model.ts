import {
  User,
  AccessTokenResponse,
  Context,
  UserCreationInput,
  UserLoginInput,
  RefreshTokenInput,
  UserUpdateInput,
  userCollection
} from './interface'
import { dbGet } from '../misc/dbUtils'
import { hashSync, compareSync } from 'bcryptjs'
import { isUserContext } from '../misc/ensureUser'
import { NonEmptyString } from 'io-ts-types'
import { Option } from 'fp-ts/Option'
import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { CoolerError, coolerError, unsafeNonEmptyString } from '../misc/Types'
import { TaskEither } from 'fp-ts/TaskEither'
import {
  getUserByEmail,
  getUserById,
  insertUser,
  updateUser as updateDatabaseUser,
  deleteUser as deleteDatabaseUser
} from './database'
import { signToken, verifyToken } from '../misc/jsonWebToken'
import { a18n } from '../misc/a18n'
import { withCollection } from '../misc/withDatabase'
import { ObjectId } from 'bson'

export function createUser(
  input: UserCreationInput,
  context: Context
): TaskEither<CoolerError, AccessTokenResponse> {
  const { name, email, password } = input

  return pipe(
    isUserContext(context),
    boolean.fold(
      () =>
        pipe(
          withCollection(userCollection, users =>
            taskEither.tryCatch(
              () => users.countDocuments(),
              () =>
                coolerError('COOLER_500', a18n`Unable to count existing users`)
            )
          ),
          taskEither.chain(
            taskEither.fromPredicate(
              count => count === 0,
              () =>
                coolerError(
                  'COOLER_403',
                  a18n`Only existing users can create new users`
                )
            )
          )
        ),
      () => taskEither.fromIO(() => 0)
    ),
    taskEither.chain(() => getUserByEmail(email)),
    taskEither.chain(
      option.fold(
        () => taskEither.right(void 0),
        () =>
          taskEither.left(
            coolerError(
              'COOLER_409',
              a18n`A registered user with this e-mail address already exists`
            )
          )
      )
    ),
    taskEither.chain(() =>
      insertUser({
        name,
        email,
        password: unsafeNonEmptyString(hashSync(password, 10))
      })
    ),
    taskEither.map(generateTokens)
  )
}

export function loginUser(
  input: UserLoginInput
): TaskEither<CoolerError, AccessTokenResponse> {
  const { email, password } = input

  return pipe(
    getUserByEmail(email),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`No user was found for this e-mail address`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        user => compareSync(password, user.password),
        () => coolerError('COOLER_400', a18n`Wrong password`)
      )
    ),
    taskEither.map(({ _id }) => generateTokens(_id))
  )
}

export function refreshToken(
  input: RefreshTokenInput
): TaskEither<CoolerError, AccessTokenResponse> {
  const { refreshToken } = input

  return pipe(
    verifyToken(refreshToken, {
      ignoreExpiration: true
    }),
    taskEither.fromOption(() =>
      coolerError('COOLER_400', a18n`The refresh token is invalid`)
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        token => token.type === 'REFRESH',
        () => coolerError('COOLER_400', a18n`This is not a refresh token`)
      )
    ),
    taskEither.chain(token => getUserById(token._id)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`No user was found for this token`)
      )
    ),
    taskEither.map(user => generateTokens(user._id, refreshToken))
  )
}

export function updateUser(
  _id: ObjectId,
  user: UserUpdateInput
): TaskEither<CoolerError, User> {
  const { name, email, password } = user

  return pipe(
    email,
    option.fromNullable,
    option.fold(
      () => taskEither.right(null),
      email =>
        pipe(
          dbGet(userCollection, collection =>
            collection.findOne({ email, _id: { $ne: _id } })
          ),
          taskEither.chain(user =>
            pipe(
              user,
              option.fold(
                () => taskEither.right(null),
                () =>
                  taskEither.left(
                    coolerError(
                      'COOLER_409',
                      a18n`A registered user with the new e-mail address already exists`
                    )
                  )
              )
            )
          )
        )
    ),
    taskEither.chain(() => getUserById(_id)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The user you want to update was not found`
        )
      )
    ),
    taskEither.chain(user =>
      updateDatabaseUser(user._id, {
        name,
        email,
        password: password
          ? pipe(
              password,
              option.map(p => unsafeNonEmptyString(hashSync(p, 10)))
            )
          : undefined
      })
    ),
    taskEither.chain(() => getUserById(_id)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_500',
          a18n`It was impossible to retrieve the user after the update`
        )
      )
    )
  )
}

export function deleteUser(_id: ObjectId): TaskEither<CoolerError, User> {
  return pipe(
    getUserById(_id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The user you want to delete was not found`
        )
      )
    ),
    taskEither.chain(user =>
      pipe(
        deleteDatabaseUser(user._id),
        taskEither.map(() => user)
      )
    )
  )
}

export function getUserFromContext<C extends Context>(
  context: C
): Option<User> {
  if (!isUserContext(context)) {
    return option.none
  }

  return option.some(context.user)
}

function generateTokens(
  userId: ObjectId,
  oldRefreshToken?: NonEmptyString
): AccessTokenResponse {
  const expiration = new Date(Date.now() + 86400000)

  const accessToken = signToken(
    {
      type: 'ACCESS',
      _id: userId
    },
    {
      expiresIn: 86400
    }
  )

  const refreshToken =
    oldRefreshToken ||
    signToken({
      type: 'REFRESH',
      _id: userId
    })

  return {
    accessToken,
    refreshToken,
    expiration
  }
}
