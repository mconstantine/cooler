import { ApolloError } from '@apollo/client'
import { LocalizedString } from '../globalDomain'

export function getGraphQLError(error: ApolloError): LocalizedString {
  return error.graphQLErrors[0].message as LocalizedString
}
