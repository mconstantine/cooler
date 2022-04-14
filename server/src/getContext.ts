import { Context } from './user/interface'
import { Task } from 'fp-ts/Task'
import { pipe } from 'fp-ts/function'
import { verifyToken } from './misc/jsonWebToken'
import { NonEmptyString } from 'io-ts-types'
import { option, task, taskEither } from 'fp-ts'
import { getUserById } from './user/database'
import { coolerError, unsafeNonEmptyString } from './misc/Types'
import { a18n } from './misc/a18n'
import { Request } from 'express'

export function validateToken(accessToken: NonEmptyString): Task<Context> {
  return pipe(
    verifyToken(accessToken),
    option.chain(option.fromPredicate(token => token.type === 'ACCESS')),
    taskEither.fromOption(() =>
      coolerError('COOLER_400', a18n`Token is invalid`)
    ),
    taskEither.chain(token => getUserById(token._id)),
    taskEither.chain(taskEither.fromOption(() => ({}))),
    taskEither.fold(
      context => task.fromIO(() => context),
      user => task.fromIO(() => ({ user }))
    )
  )
}

const languageMatchPattern = /^(.+?)-/

export const getContext = async (req: Request): Promise<Context> => {
  let lang = 'en'

  const languageMatch =
    req.headers['accept-language']
      ?.split(',')?.[0]
      ?.match(languageMatchPattern) ?? null

  if (languageMatch) {
    lang = languageMatch[1]
  }

  a18n.setLocale(lang)

  if (!req.headers.authorization || req.headers.authorization.length < 7) {
    return {}
  }

  const accessToken = unsafeNonEmptyString(
    req.headers.authorization.substring(7)
  )

  return await validateToken(accessToken)()
}
