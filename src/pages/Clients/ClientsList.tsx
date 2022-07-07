import { option } from 'fp-ts'
import { flow } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyString } from 'io-ts-types'
import { useState } from 'react'
import { a18n } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { clientsRoute, useRouter } from '../../components/Router'
import { useGet } from '../../effects/api/useApi'
import { getClientName } from '../../entities/Client'
import { unsafePositiveInteger } from '../../globalDomain'
import { ConnectionQueryInput } from '../../misc/Connection'
import { ClientForList, clientsQuery } from './domain'

export default function ClientsList() {
  const [input, setInput] = useState<ConnectionQueryInput>({
    query: option.none,
    first: unsafePositiveInteger(20),
    after: option.none
  })

  const [clients] = useGet(clientsQuery, input)
  const { setRoute } = useRouter()

  const onSearchQueryChange: Reader<string, void> = flow(
    NonEmptyString.decode,
    option.fromEither,
    query =>
      setInput({
        ...input,
        query
      })
  )

  const renderClientItem: Reader<ClientForList, RoutedItem> = client => ({
    type: 'routed',
    key: client._id,
    label: option.none,
    content: getClientName(client),
    description: option.none,
    action: () => setRoute(clientsRoute(client._id)),
    details: true
  })

  return (
    <ConnectionList
      title={a18n`Clients`}
      query={clients}
      onSearchQueryChange={onSearchQueryChange}
      action={option.none}
      onLoadMore={option.none}
      renderListItem={renderClientItem}
    />
  )
}
