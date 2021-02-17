import { ApolloError } from '@apollo/client'
import { nonEmptyArray, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { LocalizedString } from '../globalDomain'
import { GraphQLError } from 'graphql'
import { commonErrors } from './commonErrors'

export function getGraphQLError(error: ApolloError): LocalizedString {
  return pipe(
    error.graphQLErrors as GraphQLError[],
    nonEmptyArray.fromArray,
    option.fold(
      () => commonErrors.unexpected,
      errors => errors[0].message as LocalizedString
    )
  )
}
