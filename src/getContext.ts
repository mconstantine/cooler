import { Context } from './user/interface'
import { ExpressContext } from 'apollo-server-express/dist/ApolloServer'
import { SubscriptionServerOptions } from 'apollo-server-core/src'
import { Task } from 'fp-ts/Task'
import { pipe } from 'fp-ts/function'
import { verifyToken } from './misc/jsonWebToken'
import { NonEmptyString } from 'io-ts-types'
import { option, task, taskEither } from 'fp-ts'
import { getUserById } from './user/database'
import { coolerError } from './misc/Types'

function validateToken(accessToken: NonEmptyString): Task<Context> {
  return pipe(
    verifyToken(accessToken),
    option.chain(option.fromPredicate(token => token.type === 'ACCESS')),
    taskEither.fromOption(() => coolerError('COOLER_400', 'Invalid token')),
    taskEither.chain(token => getUserById(token.id)),
    taskEither.chain(taskEither.fromOption(() => ({}))),
    taskEither.fold(
      context => task.fromIO(() => context),
      user => task.fromIO(() => ({ user }))
    )
  )
}

export const getContext = async ({
  req,
  connection
}: ExpressContext): Promise<Context> => {
  if (connection) {
    return connection.context
  }

  if (!req.headers.authorization || req.headers.authorization.length < 7) {
    return {}
  }

  const accessToken = req.headers.authorization.substring(7) as NonEmptyString

  return await validateToken(accessToken)()
}

export const subscriptionOptions: Partial<SubscriptionServerOptions> = {
  onConnect: async (params: Object): Promise<Context> => {
    if ('accessToken' in params) {
      return await validateToken(params['accessToken'])()
    } else {
      return {}
    }
  }
}
