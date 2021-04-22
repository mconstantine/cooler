import { option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { TaskEither } from 'fp-ts/TaskEither'
import { useMemo } from 'react'
import { useMutation } from '../../../effects/useMutation'
import { foldQuery, useQuery } from '../../../effects/useQuery'
import { Client, ClientCreationInput } from '../../../entities/Client'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import { ErrorPanel } from '../../ErrorPanel/ErrorPanel'
import { ClientForm } from '../../Form/Forms/ClientForm'
import { LoadingBlock } from '../../Loading/LoadingBlock'
import { clientsRoute, useRouter } from '../../Router'
import {
  clientQuery,
  deleteClientMutation,
  updateClientMutation
} from './domain'

interface Props {
  id: PositiveInteger
}

export default function EditClient(props: Props) {
  const { setRoute } = useRouter()
  const input = useMemo(() => ({ id: props.id }), [props.id])
  const { query, update } = useQuery(clientQuery, input)
  const updateClient = useMutation(updateClientMutation)
  const deleteClient = useMutation(deleteClientMutation)

  const onSubmit = (
    id: PositiveInteger,
    client: ClientCreationInput
  ): TaskEither<LocalizedString, void> =>
    pipe(
      updateClient({ id, client }),
      taskEither.mapLeft(error => error.message),
      taskEither.chain(({ updateClient }) =>
        taskEither.fromIO(() =>
          update(({ client }) => ({
            client: {
              ...client,
              updateClient
            }
          }))
        )
      )
    )

  const onDelete: ReaderTaskEither<Client, LocalizedString, void> = client =>
    pipe(
      deleteClient({ id: client.id }),
      taskEither.mapLeft(error => error.message),
      taskEither.chain(() =>
        taskEither.fromIO(() => setRoute(clientsRoute('all')))
      )
    )

  return pipe(
    query,
    foldQuery(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error.message} />,
      ({ client }) => (
        <ClientForm
          client={option.some(client)}
          onSubmit={data => onSubmit(client.id, data)}
          onDelete={onDelete}
          onCancel={() => setRoute(clientsRoute('all'))}
        />
      )
    )
  )
}
