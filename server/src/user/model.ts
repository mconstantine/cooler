import {
  User,
  AccessTokenResponse,
  Context,
  UserCreationInput,
  UserLoginInput,
  RefreshTokenInput,
  UserUpdateInput
} from './interface'
import SQL from 'sql-template-strings'
import { ApolloError } from 'apollo-server-express'
import { dbGet } from '../misc/dbUtils'
import { hashSync, compareSync } from 'bcryptjs'
import { isUserContext } from '../misc/ensureUser'
import { removeUndefined } from '../misc/removeUndefined'
import { NonEmptyString } from 'io-ts-types'
import { Option } from 'fp-ts/Option'
import { boolean, option, taskEither } from 'fp-ts'
import { constUndefined, pipe } from 'fp-ts/function'
import { coolerError, PositiveInteger } from '../misc/Types'
import { TaskEither } from 'fp-ts/TaskEither'
import {
  getUserByEmail,
  getUserById,
  insertUser,
  updateUser as updateDatabaseUser,
  deleteUser as deleteDatabaseUser
} from './database'
import { Int, type } from 'io-ts'
import { signToken, verifyToken } from '../misc/jsonWebToken'
import { a18n } from '../misc/a18n'

export function createUser(
  input: UserCreationInput,
  context: Context
): TaskEither<ApolloError, AccessTokenResponse> {
  const { name, email, password } = input

  return pipe(
    isUserContext(context),
    boolean.fold(
      () =>
        pipe(
          dbGet(SQL`SELECT COUNT(id) as count FROM user`, type({ count: Int })),
          taskEither.chain(
            taskEither.fromOption(() =>
              coolerError('COOLER_500', a18n`Unable to count existing users`)
            )
          ),
          taskEither.chain(
            taskEither.fromPredicate(
              ({ count }) => count === 0,
              () =>
                coolerError(
                  'COOLER_403',
                  a18n`Only existing users can create new users`
                )
            )
          )
        ),
      () => taskEither.fromIO(() => ({ count: 0 }))
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
        password: hashSync(password, 10) as NonEmptyString
      })
    ),
    taskEither.map(generateTokens)
  )
}

export function loginUser(
  input: UserLoginInput
): TaskEither<ApolloError, AccessTokenResponse> {
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
    taskEither.map(({ id }) => generateTokens(id))
  )
}

export function refreshToken(
  input: RefreshTokenInput
): TaskEither<ApolloError, AccessTokenResponse> {
  const { refreshToken } = input

  return pipe(
    verifyToken(refreshToken, {
      ignoreExpiration: true
    }),
    taskEither.fromOption(() =>
      coolerError('COOLER_400', a18n`The refresk token is invalid`)
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        token => token.type === 'REFRESH',
        () => coolerError('COOLER_400', a18n`This is not a refresh token`)
      )
    ),
    taskEither.chain(token => getUserById(token.id)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`No user was found for this token`)
      )
    ),
    taskEither.map(user => generateTokens(user.id, refreshToken))
  )
}

export function updateUser(
  id: PositiveInteger,
  user: UserUpdateInput
): TaskEither<ApolloError, User> {
  const { name, email, password } = user

  return pipe(
    email,
    option.fromNullable,
    option.fold(
      () => taskEither.right(null),
      email =>
        pipe(
          dbGet(
            SQL`SELECT id FROM user WHERE email = ${email} AND id != ${id}`,
            type({ id: PositiveInteger })
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
    taskEither.chain(() => getUserById(id)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The user you want to update was not found`
        )
      )
    ),
    taskEither.chain(user => {
      const args: UserUpdateInput = removeUndefined({
        name,
        email,
        password: pipe(
          password,
          option.fromNullable,
          option.fold(constUndefined, p => hashSync(p, 10) as NonEmptyString)
        )
      })

      return updateDatabaseUser(user.id, args)
    }),
    taskEither.chain(() => getUserById(id)),
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

export function deleteUser(id: PositiveInteger): TaskEither<ApolloError, User> {
  return pipe(
    getUserById(id),
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
        deleteDatabaseUser(user.id),
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
  userId: PositiveInteger,
  oldRefreshToken?: NonEmptyString
): AccessTokenResponse {
  const expiration = new Date(Date.now() + 86400000)

  const accessToken = signToken(
    {
      type: 'ACCESS',
      id: userId
    },
    {
      expiresIn: 86400
    }
  )

  const refreshToken =
    oldRefreshToken ||
    signToken({
      type: 'REFRESH',
      id: userId
    })

  return {
    accessToken,
    refreshToken,
    expiration
  }
}
