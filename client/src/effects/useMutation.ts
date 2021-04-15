import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { useAccount } from '../contexts/AccountContext'
import { ApiError, GraphQLMutation, sendGraphQLCall } from '../misc/graphql'

export function useMutation<I, II, O, OO>(
  mutation: GraphQLMutation<I, II, O, OO>
): ReaderTaskEither<I, ApiError, O> {
  const accountContext = useAccount()

  if (!mutation.query.loc) {
    throw new Error('Called useMutation with a mutation witout source')
  }

  return variables => sendGraphQLCall(accountContext, mutation, variables)
}
