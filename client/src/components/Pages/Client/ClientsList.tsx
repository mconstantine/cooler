import { option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyString } from 'io-ts-types'
import { add } from 'ionicons/icons'
import { useCallback, useState } from 'react'
import { a18n } from '../../../a18n'
import { foldQuery, useQuery } from '../../../effects/useQuery'
import { LocalizedString, unsafePositiveInteger } from '../../../globalDomain'
import { ConnectionQueryInput } from '../../../misc/graphql'
import { ConnectionList } from '../../ConnectionList/ConnectionList'
import { RoutedItem } from '../../List/List'
import { clientsRoute, useRouter } from '../../Router'
import { ClientForList, clientsQuery, foldClientForList } from './domain'

const clientsPerPage = unsafePositiveInteger(20)

export default function ClientsList() {
  const { setRoute } = useRouter()

  const [input, setInput] = useState<ConnectionQueryInput>({
    name: option.none,
    first: clientsPerPage
  })

  const { query: clients } = useQuery(clientsQuery, input)

  const renderClient = (client: ClientForList): RoutedItem => ({
    key: client.id,
    type: 'routed',
    label: option.none,
    content: pipe(
      client,
      foldClientForList(
        client => `${client.first_name} ${client.last_name}` as LocalizedString,
        client => client.business_name
      )
    ),
    description: option.none,
    action: () => setRoute(clientsRoute(client.id)),
    details: true
  })

  const onSearchQueryChange: Reader<string, void> = useCallback(
    query =>
      setInput({
        name: pipe(query, NonEmptyString.decode, option.fromEither),
        first: clientsPerPage
      }),
    []
  )

  const onLoadMore = () =>
    pipe(
      clients,
      foldQuery(constVoid, constVoid, ({ clients }) =>
        setInput(input => ({
          ...input,
          first: unsafePositiveInteger(clients.edges.length + clientsPerPage)
        }))
      )
    )

  return (
    <ConnectionList
      title={a18n`Clients`}
      action={option.some({
        type: 'sync',
        label: a18n`New client`,
        icon: option.some(add),
        action: () => setRoute(clientsRoute('new'))
      })}
      query={clients}
      extractConnection={({ clients }) => clients}
      renderListItem={renderClient}
      onSearchQueryChange={onSearchQueryChange}
      onLoadMore={onLoadMore}
    />
  )
}
