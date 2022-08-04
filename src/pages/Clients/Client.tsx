import { pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { useEffect } from 'react'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { clientsRoute, useRouter } from '../../components/Router'
import { query } from '../../effects/api/api'
import { useReactiveCommand } from '../../effects/api/useApi'
import { Client as ClientType } from '../../entities/Client'
import { ObjectId } from '../../globalDomain'
import { ClientData } from './ClientData'
import { ClientProjects } from './ClientProjects'
import { makeClientQuery } from './domain'

interface Props {
  _id: ObjectId
}

export default function Client(props: Props) {
  const [client, setClient, fetchClient] = useReactiveCommand(
    makeClientQuery(props._id)
  )
  const { setRoute } = useRouter()

  const onUpdate: Reader<ClientType, void> = setClient
  const onDelete: Reader<ClientType, void> = () => setRoute(clientsRoute('all'))

  useEffect(() => {
    fetchClient()()
  }, [fetchClient])

  return pipe(
    client,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      client => (
        <>
          <ClientData client={client} onUpdate={onUpdate} onDelete={onDelete} />
          <ClientProjects clientId={client._id} />
        </>
      )
    )
  )
}
