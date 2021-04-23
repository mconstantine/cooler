import { boolean, option, taskEither } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { arrowUp, skull } from 'ionicons/icons'
import { useMemo, useState } from 'react'
import { a18n, formatDate, unsafeLocalizedString } from '../../../a18n'
import { useDialog } from '../../../effects/useDialog'
import { useMutation } from '../../../effects/useMutation'
import { foldQuery, useQuery } from '../../../effects/useQuery'
import {
  Client,
  ClientCreationInput,
  CountryValues,
  foldClient,
  getClientName,
  ProvinceValues
} from '../../../entities/Client'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import { Button } from '../../Button/Button/Button'
import { Buttons } from '../../Button/Buttons/Buttons'
import { LoadingButton } from '../../Button/LoadingButton/LoadingButton'
import { ErrorPanel } from '../../ErrorPanel/ErrorPanel'
import { ClientForm } from '../../Form/Forms/ClientForm'
import { ReadOnlyInput } from '../../Form/Input/ReadOnlyInput/ReadOnlyInput'
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

export default function ClientData(props: Props) {
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
              ...updateClient
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
                  {pipe(
                    client,
                    foldClient(
                      client => (
                        <>
                          <ReadOnlyInput
                            name="firstName"
                            label={a18n`First name`}
                            value={client.first_name}
                          />
                          <ReadOnlyInput
                            name="lastName"
                            label={a18n`Last name`}
                            value={client.last_name}
                          />
                          <ReadOnlyInput
                            name="fiscalCode"
                            label={a18n`Fiscal code`}
                            value={client.fiscal_code}
                          />
                        </>
                      ),
                      client => (
                        <>
                          <ReadOnlyInput
                            name="business_name"
                            label={a18n`Business name`}
                            value={client.business_name}
                          />
                          <ReadOnlyInput
                            name="country"
                            label={a18n`Country`}
                            value={CountryValues[client.country_code]}
                          />
                          <ReadOnlyInput
                            name="vatNumber"
                            label={a18n`VAT number`}
                            value={client.vat_number}
                          />
                        </>
                      )
                    )
                  )}
                  <ReadOnlyInput
                    name="address_country"
                    label={a18n`Address – country`}
                    value={CountryValues[client.address_country]}
                  />
                  <ReadOnlyInput
                    name="address_province"
                    label={a18n`Address – province`}
                    value={ProvinceValues[client.address_province]}
                  />
                  <ReadOnlyInput
                    name="address_city"
                    label={a18n`Address – city`}
                    value={client.address_city}
                  />
                  <ReadOnlyInput
                    name="address_zip"
                    label={a18n`Address – ZIP code`}
                    value={client.address_zip}
                  />
                  <ReadOnlyInput
                    name="address_street"
                    label={a18n`Address – street`}
                    value={client.address_street}
                  />
                  {pipe(
                    client.address_street_number,
                    option.fold(constNull, streetNumber => (
                      <ReadOnlyInput
                        name="address_street_number"
                        label={a18n`Address – street number`}
                        value={streetNumber}
                      />
                    ))
                  )}
                  <ReadOnlyInput
                    name="address_email"
                    label={a18n`E-mail address`}
                    value={unsafeLocalizedString(client.address_email)}
                  />
                  <ReadOnlyInput
                    name="created_at"
                    label={a18n`Created at`}
                    value={formatDate(client.created_at)}
                  />
                  <ReadOnlyInput
                    name="updated_at"
                    label={a18n`Last updated at`}
                    value={formatDate(client.updated_at)}
                  />
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
