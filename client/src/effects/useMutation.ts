import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { useGraphQL } from '../contexts/GraphQLContext'
import { ApiError, GraphQLMutation } from '../misc/graphql'

export function useMutation<I, II, O, OO>(
  mutation: GraphQLMutation<I, II, O, OO>
): ReaderTaskEither<I, ApiError, O> {
  const { sendGraphQLCall } = useGraphQL()

  if (!mutation.query.loc) {
    throw new Error('Called useMutation with a mutation witout source')
  }

  return variables => sendGraphQLCall(mutation, variables)
}
