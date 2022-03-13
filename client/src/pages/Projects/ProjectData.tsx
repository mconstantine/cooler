import { array, boolean, option, taskEither } from 'fp-ts'
import { constNull, flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { NonEmptyString } from 'io-ts-types'
import { useState } from 'react'
import {
  a18n,
  formatDateTime,
  formatMoneyAmount,
  unsafeLocalizedString
} from '../../a18n'
import { Button } from '../../components/Button/Button/Button'
import { Buttons } from '../../components/Button/Buttons/Buttons'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { ProjectForm } from '../../components/Form/Forms/ProjectForm'
import { ReadOnlyInput } from '../../components/Form/Input/ReadOnlyInput/ReadOnlyInput'
import { Panel } from '../../components/Panel/Panel'
import { useDelete, useLazyGet, usePut } from '../../effects/api/useApi'
import { getClientName } from '../../entities/Client'
import { Project, ProjectCreationInput } from '../../entities/Project'
import {
  LocalizedString,
  PositiveInteger,
  unsafePositiveInteger
} from '../../globalDomain'
import { getConnectionNodes } from '../../misc/Connection'
import { clientsQuery } from '../Client/domain'
import { makeDeleteProjectRequest, makeUpdateProjectRequest } from './domain'
import { LoadingButton } from '../../components/Button/LoadingButton/LoadingButton'
import { skull } from 'ionicons/icons'
import { useDialog } from '../../effects/useDialog'
import { Option } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'

interface Props {
  project: Project
  onUpdate: Reader<Project, void>
  onDelete: Reader<Project, void>
}

export function ProjectData(props: Props) {
  const findClientsCommand = useLazyGet(clientsQuery)
  const [isEditing, setIsEditing] = useState(false)
  const updateProjectCommand = usePut(
    makeUpdateProjectRequest(props.project.id)
  )
  const deleteProjectCommand = useDelete(
    makeDeleteProjectRequest(props.project.id)
  )
  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  const [Dialog, deleteProject] = useDialog<void, void, void>(
    () =>
      pipe(
        taskEither.rightIO(() => setError(option.none)),
        taskEither.chain(deleteProjectCommand),
        taskEither.bimap(
          error => pipe(error.message, option.some, setError),
          props.onDelete
        )
      ),
    {
      title: () => a18n`Are you sure you want to delete your account?`,
      message: () =>
        a18n`All your data, clients, projects, tasks and sessions will be deleted!`
    }
  )

  const findClients: ReaderTaskEither<
    string,
    LocalizedString,
    Record<PositiveInteger, LocalizedString>
  > = query =>
    pipe(
      findClientsCommand({
        name: pipe(query, NonEmptyString.decode, option.fromEither),
        first: unsafePositiveInteger(10),
        after: option.none
      }),
      taskEither.bimap(
        error => error.message,
        flow(
          getConnectionNodes,
          array.reduce({}, (res, client) => ({
            ...res,
            [client.id]: getClientName(client)
          }))
        )
      )
    )

  const onCancel: IO<void> = () => setIsEditing(false)

  const onSubmit: ReaderTaskEither<
    ProjectCreationInput,
    LocalizedString,
    void
  > = flow(
    updateProjectCommand,
    taskEither.bimap(
      error => error.message,
      project => {
        setIsEditing(false)
        props.onUpdate(project)
      }
    )
  )

  return pipe(
    isEditing,
    boolean.fold(
      () => (
        <Panel title={props.project.name} framed action={option.none}>
          <ReadOnlyInput
            name="name"
            label={a18n`Name`}
            value={props.project.name}
          />
          <ReadOnlyInput
            name="description"
            label={a18n`Description`}
            value={pipe(
              props.project.description,
              option.getOrElse(() => unsafeLocalizedString(''))
            )}
          />
          <ReadOnlyInput
            name="client"
            label={a18n`Client`}
            value={props.project.client.name}
          />
          <ReadOnlyInput
            name="created_at"
            label={a18n`Created at`}
            value={formatDateTime(props.project.created_at)}
          />
          <ReadOnlyInput
            name="updated_at"
            label={a18n`Last updated at`}
            value={formatDateTime(props.project.updated_at)}
          />
          {pipe(
            props.project.cashed,
            option.fold(
              () => (
                <ReadOnlyInput
                  name="cashed_status"
                  label={a18n`Cashed status`}
                  value={a18n`Not cashed`}
                />
              ),
              ({ at, balance }) => (
                <>
                  <ReadOnlyInput
                    name="cashed_at"
                    label={a18n`Cashed at`}
                    value={formatDateTime(at)}
                  />
                  <ReadOnlyInput
                    name="cashed_balance"
                    label={a18n`Cashed balance`}
                    value={formatMoneyAmount(balance)}
                  />
                </>
              )
            )
          )}
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
              type="button"
              label={a18n`Delete project`}
              color="danger"
              flat
              action={deleteProject()}
              icon={skull}
            />
          </Buttons>
          <Dialog />
        </Panel>
      ),
      () => (
        <ProjectForm
          project={option.some(props.project)}
          findClients={findClients}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )
    )
  )
}
