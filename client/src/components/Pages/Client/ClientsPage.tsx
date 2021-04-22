import { option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyString } from 'io-ts-types'
import { add } from 'ionicons/icons'
import { useCallback, useState } from 'react'
import { a18n } from '../../../a18n'
import { foldQuery, useQuery } from '../../../effects/useQuery'
import { LocalizedString, unsafePositiveInteger } from '../../../globalDomain'
import { ConnectionList } from '../../ConnectionList/ConnectionList'
import { Content } from '../../Content/Content'
import { RoutedItem } from '../../List/List'
import { Menu } from '../../Menu/Menu'
import {
  clientsQuery,
  ClientsQueryInput,
  ClientForList,
  foldClientForList
} from './domain'

const first = unsafePositiveInteger(1)

export default function ClientsPage() {
  const [input, setInput] = useState<ClientsQueryInput>({
    name: option.none,
    first
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
    action: () => console.log(`TODO: go to client ${client.id}`),
    details: true
  })

  const onSearchQueryChange: Reader<string, void> = useCallback(
    query =>
      setInput({
        name: pipe(query, NonEmptyString.decode, option.fromEither),
        first
      }),
    []
  )

  const onLoadMore = () =>
    pipe(
      clients,
      foldQuery(constVoid, constVoid, ({ clients }) =>
        setInput(input => ({
          ...input,
          first: unsafePositiveInteger(clients.edges.length + first)
        }))
      )
    )

  return (
    <div className="ClientsPage">
      <Menu />
      <Content>
        <ConnectionList
          title={a18n`Clients`}
          action={option.some({
            type: 'sync',
            label: a18n`New client`,
            icon: option.some(add),
            action: () => console.log('TODO: switch view')
          })}
          query={clients}
          extractConnection={({ clients }) => clients}
          renderListItem={renderClient}
          onSearchQueryChange={onSearchQueryChange}
          onLoadMore={onLoadMore}
        />
      </Content>
    </div>
  )
}
