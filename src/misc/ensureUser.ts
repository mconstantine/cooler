import { UserContext, User } from '../user/interface'
import { ApolloError } from 'apollo-server-express'

export function ensureUser(context: UserContext): User {
  if (!context.user) {
    throw new ApolloError('Unauthorized', 'COOLER_401')
  }

  return context.user
}
