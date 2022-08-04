import { array, option, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { NonEmptyString } from 'io-ts-types'
import { useLazyGet } from '../../effects/api/useApi'
import { getClientName } from '../../entities/Client'
import {
  LocalizedString,
  ObjectId,
  unsafePositiveInteger
} from '../../globalDomain'
import { getConnectionNodes } from '../../misc/Connection'
import { clientsQuery } from '../Clients/domain'

export function useFindClients(): ReaderTaskEither<
  string,
  LocalizedString,
  Record<ObjectId, LocalizedString>
> {
  const findClientsCommand = useLazyGet(clientsQuery)

  return query =>
    pipe(
      findClientsCommand({
        query: pipe(query, NonEmptyString.decode, option.fromEither),
        first: unsafePositiveInteger(10),
        after: option.none
      }),
      taskEither.map(
        flow(
          getConnectionNodes,
          array.reduce({}, (res, client) => ({
            ...res,
            [client._id]: getClientName(client)
          }))
        )
      )
    )
}
