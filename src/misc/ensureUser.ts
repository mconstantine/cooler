import { UserContext } from '../user/interface'
import { ApolloError } from 'apollo-server-express'

export function ensureUser(context: UserContext) {
  if (!context.user) {
    throw new ApolloError('Unauthorized', 'COOLER_401')
  }

  return
}
