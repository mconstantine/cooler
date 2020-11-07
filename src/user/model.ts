import {
  User,
  Token,
  AccessTokenResponse,
  Context,
  UserCreationInput,
  UserLoginInput,
  RefreshTokenInput,
  UserUpdateInput,
  UserContext
} from './interface'
import SQL from 'sql-template-strings'
import { ApolloError } from 'apollo-server-express'
import { dbGet } from '../misc/dbUtils'
import { hashSync, compareSync } from 'bcryptjs'
import { sign, SignOptions, verify, VerifyOptions } from 'jsonwebtoken'
import { isUserContext } from '../misc/ensureUser'
import { removeUndefined } from '../misc/removeUndefined'
import { NonEmptyString } from 'io-ts-types'
import { None, Option, Some } from 'fp-ts/Option'
import { boolean, either, option, taskEither } from 'fp-ts'
import { constUndefined, constVoid, pipe } from 'fp-ts/function'
import { coolerError, PositiveInteger } from '../misc/Types'
import { TaskEither } from 'fp-ts/TaskEither'
import { getUserByEmail, getUserById, insertUser } from './database'
import { Int, type } from 'io-ts'

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
              coolerError('COOLER_500', 'Unable to count existing users')
            )
          )
        ),
      () => taskEither.fromIO(() => ({ count: 0 }))
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        ({ count }) => count > 0,
        () => coolerError('COOLER_500', 'Unable to count users')
      )
    ),
    taskEither.chain(() => getUserByEmail(email)),
    taskEither.chain(
      option.fold(
        () => taskEither.right(void 0),
        () => taskEither.left(coolerError('COOLER_409', 'Duplicate user'))
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
      taskEither.fromOption(() => coolerError('COOLER_404', 'User not found'))
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        user => compareSync(password, user.password),
        () => coolerError('COOLER_400', 'Wrong password')
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
    taskEither.fromOption(() => coolerError('COOLER_400', 'Invalid token')),
    taskEither.chain(
      taskEither.fromPredicate(
        token => token.type === 'REFRESH',
        () => coolerError('COOLER_400', 'Invalid token type')
      )
    ),
    taskEither.chain(token => getUserById(token.id)),
    taskEither.chain(
      taskEither.fromOption(() => coolerError('COOLER_404', 'User not found'))
    ),
    taskEither.map(user => generateTokens(user.id, refreshToken))
  )
}

export function updateUser(
  id: PositiveInteger,
  user: UserUpdateInput
): TaskEither<ApolloError, Option<User>> {
  const { name, email, password } = user

  return pipe(
    email,
    option.fromNullable,
    option.fold(
      () =>
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
                  taskEither.left(coolerError('COOLER_409', 'Duplicate user'))
              )
            )
          )
        ),
      () => taskEither.right(null)
    ),
    taskEither.chain(() => getUserById(id)),
    taskEither.chain(
      taskEither.fromOption(() => coolerError('COOLER_404', 'User not found'))
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

      return updateUser(user.id, args)
    }),
    taskEither.chain(() => getUserById(id))
  )
}

export function deleteUser(
  id: PositiveInteger
): TaskEither<ApolloError, Option<User>> {
  return pipe(
    getUserById(id),
    taskEither.chain(
      taskEither.fromOption(() => coolerError('COOLER_404', 'User not found'))
    ),
    taskEither.chain(user =>
      pipe(
        deleteUser(user.id),
        taskEither.map(() => option.some(user))
      )
    )
  )
}

export function getUserFromContext<C extends UserContext>(
  context: C
): Some<User>
export function getUserFromContext<C extends Context>(context: C): None
export function getUserFromContext<C extends Context>(
  context: C
): Option<User> {
  if (!isUserContext(context)) {
    return option.none
  }

  return option.some(context.user)
}

function signToken(token: Token, options?: SignOptions): NonEmptyString {
  return sign(token, process.env.SECRET!, options) as NonEmptyString
}

function verifyToken(
  token: NonEmptyString,
  options?: VerifyOptions
): Option<Token> {
  return pipe(
    either.tryCatch(
      () => verify(token, process.env.SECRET!, options) as Token,
      constVoid
    ),
    option.fromEither
  )
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
