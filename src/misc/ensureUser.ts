import { UserContext, User, Context } from '../user/interface'
import { ApolloError } from 'apollo-server-express'
import { getUserFromContext } from '../user/model'

export function ensureUser(context: Context): User {
  if (!isUserContext(context)) {
    throw new ApolloError('Unauthorized', 'COOLER_401')
  }

  return getUserFromContext(context)
}

export function isUserContext(context: Context): context is UserContext {
  return 'user' in context
}
