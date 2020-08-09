import { UserContext } from '../user/User'
import { ApolloError } from 'apollo-server'
import { COOLER_ERROR_CODE } from './CoolerErrorCode'

export function ensureUser(context: UserContext) {
  if (!context.user) {
    throw new ApolloError('Unauthorized', COOLER_ERROR_CODE)
  }

  return
}
