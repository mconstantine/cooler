import { boolean, option, taskEither } from 'fp-ts'
import { constNull, flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { Option } from 'fp-ts/Option'
import { skull } from 'ionicons/icons'
import { useState } from 'react'
import { a18n, formatDateTime, unsafeLocalizedString } from '../../a18n'
import { Button } from '../../components/Button/Button/Button'
import { Buttons } from '../../components/Button/Buttons/Buttons'
import { LoadingButton } from '../../components/Button/LoadingButton/LoadingButton'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { ClientForm } from '../../components/Form/Forms/ClientForm'
import { ReadOnlyInput } from '../../components/Form/Input/ReadOnlyInput/ReadOnlyInput'
import { Panel } from '../../components/Panel/Panel'
import { useDialog } from '../../effects/useDialog'
import {
  Client,
  ClientCreationInput,
  CountryValues,
  foldClient,
  getClientName,
  ProvinceValues
} from '../../entities/Client'
import { LocalizedString } from '../../globalDomain'
import { useDelete, usePut } from '../../effects/api/useApi'
import { makeDeleteClientRequest, makeUpdateClientRequest } from './domain'
import { Reader } from 'fp-ts/Reader'

interface Props {
  client: Client
  onUpdate: Reader<Client, void>
  onDelete: Reader<Client, void>
}

export function ClientData(props: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  const updateClientCommand = usePut(makeUpdateClientRequest(props.client._id))

  const deleteClientCommand = useDelete(
    makeDeleteClientRequest(props.client._id)
  )

  const [Dialog, deleteClient] = useDialog<Client, void, void>(
    () =>
      pipe(
        taskEither.rightIO(() => setError(option.none)),
        taskEither.chain(deleteClientCommand),
        taskEither.bimap(
          error => pipe(error, option.some, setError),
          props.onDelete
        )
      ),
    {
      title: client =>
        a18n`Are you sure you want to delete the client "${getClientName(
          client
        )}"?`,
      message: () =>
        a18n`All your data, projects, tasks and sessions will be deleted!`
    }
  )

  const onCancel: IO<void> = () => setIsEditing(false)

  const onSubmit: ReaderTaskEither<ClientCreationInput, LocalizedString, void> =
    flow(
      updateClientCommand,
      taskEither.map(client => {
        setIsEditing(false)
        props.onUpdate(client)
      })
    )

  return pipe(
    isEditing,
    boolean.fold(
      () => (
        <Panel title={getClientName(props.client)} framed action={option.none}>
          {pipe(
            props.client,
            foldClient(
              client => (
                <>
                  <ReadOnlyInput
                    label={a18n`Fiscal code`}
                    name="fiscalCode"
                    value={client.fiscalCode}
                  />
                  <ReadOnlyInput
                    label={a18n`First name`}
                    name="firstName"
                    value={client.firstName}
                  />
                  <ReadOnlyInput
                    label={a18n`Last name`}
                    name="lastName"
                    value={client.lastName}
                  />
                </>
              ),
              client => (
                <>
                  <ReadOnlyInput
                    label={a18n`Country`}
                    name="country"
                    value={CountryValues[client.countryCode]}
                  />
                  <ReadOnlyInput
                    label={a18n`VAT number`}
                    name="vatNumber"
                    value={client.vatNumber}
                  />
                  <ReadOnlyInput
                    label={a18n`Business name`}
                    name="businessName"
                    value={client.businessName}
                  />
                </>
              )
            )
          )}
          <ReadOnlyInput
            label={a18n`Country (address)`}
            name="addressCountry"
            value={CountryValues[props.client.addressCountry]}
          />
          <ReadOnlyInput
            label={a18n`Province (address)`}
            name="addressProvince"
            value={ProvinceValues[props.client.addressProvince]}
          />
          <ReadOnlyInput
            label={a18n`City (address)`}
            name="addressCity"
            value={props.client.addressCity}
          />
          <ReadOnlyInput
            label={a18n`ZIP code (address)`}
            name="addressZIP"
            value={props.client.addressZIP}
          />
          <ReadOnlyInput
            label={a18n`Street (address)`}
            name="addressStreet"
            value={props.client.addressStreet}
          />
          <ReadOnlyInput
            label={a18n`Street number (address)`}
            name="addressStreetNumber"
            value={pipe(
              props.client.addressStreetNumber,
              option.getOrElse(() => unsafeLocalizedString('–'))
            )}
          />
          <ReadOnlyInput
            label={a18n`E-mail address`}
            name="addressEmail"
            value={unsafeLocalizedString(props.client.addressEmail)}
          />
          <ReadOnlyInput
            label={a18n`Created at`}
            name="createdAt"
            value={formatDateTime(props.client.createdAt)}
          />
          <ReadOnlyInput
            label={a18n`Last updated at`}
            name="updatedAt"
            value={formatDateTime(props.client.updatedAt)}
          />
          {pipe(
            error,
            option.fold(constNull, error => <ErrorPanel error={error} />)
          )}
          <Buttons spacing="spread">
            <Button
              type="button"
              color="primary"
              label={a18n`Edit`}
              action={() => setIsEditing(true)}
              icon={option.none}
            />
            <LoadingButton
              type="loadingButton"
              label={a18n`Delete client`}
              color="danger"
              flat
              action={deleteClient(props.client)}
              icon={skull}
            />
          </Buttons>
          <Dialog />
        </Panel>
      ),
      () => (
        <ClientForm
          client={option.some(props.client)}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )
    )
  )
}
