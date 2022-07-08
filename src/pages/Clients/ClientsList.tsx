import { option } from 'fp-ts'
import { Reader } from 'fp-ts/Reader'
import { a18n } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { clientsRoute, useRouter } from '../../components/Router'
import { getClientName } from '../../entities/Client'
import { ClientForList, clientsQuery } from './domain'
import { useConnection } from '../../effects/useConnection'

export default function ClientsList() {
  const { setRoute } = useRouter()

  const renderClientItem: Reader<ClientForList, RoutedItem> = client => ({
    type: 'routed',
    key: client._id,
    label: option.none,
    content: getClientName(client),
    description: option.none,
    action: () => setRoute(clientsRoute(client._id)),
    details: true
  })

  const {
    results: clients,
    onSearchQueryChange,
    onLoadMore
  } = useConnection(clientsQuery)

  return (
    <ConnectionList
      title={a18n`Clients`}
      query={clients}
      onSearchQueryChange={onSearchQueryChange}
      action={option.none}
      onLoadMore={option.some(onLoadMore)}
      renderListItem={renderClientItem}
    />
  )
}
