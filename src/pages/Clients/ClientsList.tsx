import { boolean, eq, option } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyString } from 'io-ts-types'
import { useEffect, useState } from 'react'
import { a18n } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { clientsRoute, useRouter } from '../../components/Router'
import { query } from '../../effects/api/api'
import { Query } from '../../effects/api/Query'
import { useReactiveCommand } from '../../effects/api/useApi'
import { usePrevious } from '../../effects/usePrevious'
import { getClientName } from '../../entities/Client'
import { LocalizedString, unsafePositiveInteger } from '../../globalDomain'
import { Connection, ConnectionQueryInput, Edge } from '../../misc/Connection'
import { ClientForList, clientsQuery } from './domain'

export default function ClientsList() {
  const [input, setInput] = useState<ConnectionQueryInput>({
    query: option.none,
    first: unsafePositiveInteger(1),
    after: option.none
  })

  const previousInput = usePrevious(input)
  const [connection, , fetchConnection] = useReactiveCommand(clientsQuery)

  const [clients, setClients] = useState<
    Query<LocalizedString, Connection<ClientForList>>
  >(query.loading)

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

  const onLoadMore: IO<void> = () => {
    pipe(
      connection,
      query.map(connection =>
        query.fromIO(() =>
          pipe(
            connection.pageInfo.hasNextPage,
            boolean.fold(constVoid, () =>
              pipe(
                connection.pageInfo.endCursor,
                option.fold(constVoid, endCursor =>
                  fetchConnection({
                    ...input,
                    after: option.some(endCursor)
                  })()
                )
              )
            )
          )
        )
      )
    )
  }

  useEffect(() => {
    fetchConnection(input)()
  }, [input, fetchConnection])

  useEffect(() => {
    setClients(clients =>
      pipe(
        connection,
        query.map(connection => {
          if (
            connection.pageInfo.hasPreviousPage &&
            option.getEq(eq.eqStrict).equals(input.query, previousInput.query)
          ) {
            return {
              pageInfo: connection.pageInfo,
              edges: [
                ...pipe(
                  clients,
                  query.map(_ => _.edges),
                  query.getOrElse(() => [] as Edge<ClientForList>[])
                ),
                ...connection.edges
              ]
            }
          } else {
            return connection
          }
        })
      )
    )
  }, [connection, input.query, previousInput.query])

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
