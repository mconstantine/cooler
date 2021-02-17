import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { foldAccount } from '../contexts/AccountContext'
import { useStorage } from './useStorage'

export function useApolloClient() {
  const { readStorage } = useStorage()

  const httpLink = createHttpLink({
    uri: process.env.REACT_APP_API_URL
  })

  const authLink = setContext((_, { headers }) => {
    const accessToken = pipe(
      readStorage('account'),
      option.chain(
        foldAccount(
          () => option.none,
          account => option.some(account.accessToken)
        )
      )
    )

    return {
      headers: {
        ...headers,
        Authorization: pipe(
          accessToken,
          option.fold(
            () => '',
            accessToken => `Bearer ${accessToken}`
          )
        )
      }
    }
  })

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
  })

  return client
}
