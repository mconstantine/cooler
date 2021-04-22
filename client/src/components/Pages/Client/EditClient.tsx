import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { arrowUp, skull } from 'ionicons/icons'
import { useMemo, useState } from 'react'
import { a18n } from '../../../a18n'
import { useDialog } from '../../../effects/useDialog'
import { useMutation } from '../../../effects/useMutation'
import { foldQuery, useQuery } from '../../../effects/useQuery'
import {
  Client,
  ClientCreationInput,
  getClientName
} from '../../../entities/Client'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import { Button } from '../../Button/Button/Button'
import { Buttons } from '../../Button/Buttons/Buttons'
import { LoadingButton } from '../../Button/LoadingButton/LoadingButton'
import { ErrorPanel } from '../../ErrorPanel/ErrorPanel'
import { ClientForm } from '../../Form/Forms/ClientForm'
import { LoadingBlock } from '../../Loading/LoadingBlock'
import { Panel } from '../../Panel/Panel'
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
  const [isEditing, setIsEditing] = useState(false)

  const [Dialog, onDelete] = useDialog(
    (client: Client) =>
      pipe(
        deleteClient({ id: client.id }),
        taskEither.mapLeft(error => error.message),
        taskEither.chain(() =>
          taskEither.fromIO(() => setRoute(clientsRoute('all')))
        )
      ),
    {
      title: client => {
        const clientName = getClientName(client)
        return a18n`Are you sure you want to delete ${clientName}?`
      },
      message: () =>
        a18n`All data about this client, its projects, tasks, sessions will be deleted!`
    }
  )

  const onSubmit = (
    id: PositiveInteger,
    client: ClientCreationInput
  ): TaskEither<LocalizedString, void> =>
    pipe(
      updateClient({ id, client }),
      taskEither.mapLeft(error => error.message),
      taskEither.chain(({ updateClient }) =>
        taskEither.fromIO(() => {
          update(({ client }) => ({
            client: {
              ...client,
              updateClient
            }
          }))

          setIsEditing(false)
        })
      )
    )

  return pipe(
    query,
    foldQuery(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error.message} />,
      ({ client }) =>
        pipe(
          isEditing,
          boolean.fold(
            () => (
              <>
                <Panel
                  framed
                  title={getClientName(client)}
                  action={option.some({
                    type: 'sync',
                    label: a18n`Back`,
                    icon: option.some(arrowUp),
                    action: () => setRoute(clientsRoute('all'))
                  })}
                >
                  {/* TODO: put all data here */}
                  <Buttons spacing="spread">
                    <Button
                      type="button"
                      label={a18n`Edit`}
                      action={() => setIsEditing(true)}
                      icon={option.none}
                    />
                    <LoadingButton
                      type="button"
                      label={a18n`Delete`}
                      icon={skull}
                      color="danger"
                      action={onDelete(client)}
                    />
                  </Buttons>
                </Panel>
                <Dialog />
              </>
            ),
            () => (
              <ClientForm
                client={option.some(client)}
                onSubmit={data => onSubmit(client.id, data)}
                onCancel={() => setIsEditing(false)}
              />
            )
          )
        )
    )
  )
}
