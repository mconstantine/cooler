import { UserContext } from '../user/User'
import { ApolloError } from 'apollo-server'

export function ensureUser(context: UserContext) {
  if (!context.user) {
    throw new ApolloError('Unauthorized', 'COOLER_401')
  }

  return
}
