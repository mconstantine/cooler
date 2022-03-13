import { array, boolean, option, taskEither } from 'fp-ts'
import { constNull, flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { NonEmptyString } from 'io-ts-types'
import { useEffect, useState } from 'react'
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
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { query } from '../../effects/api/api'
import {
  useDelete,
  useLazyGet,
  usePut,
  useReactiveCommand
} from '../../effects/api/useApi'
import { getClientName } from '../../entities/Client'
import { ProjectCreationInput } from '../../entities/Project'
import {
  LocalizedString,
  PositiveInteger,
  unsafePositiveInteger
} from '../../globalDomain'
import { getConnectionNodes } from '../../misc/Connection'
import { clientsQuery } from '../Client/domain'
import {
  makeDeleteProjectRequest,
  makeProjectQuery,
  makeUpdateProjectRequest
} from './domain'
import { LoadingButton } from '../../components/Button/LoadingButton/LoadingButton'
import { skull } from 'ionicons/icons'
import { useDialog } from '../../effects/useDialog'
import { Option } from 'fp-ts/Option'
import { projectsRoute, useRouter } from '../../components/Router'

interface Props {
  id: PositiveInteger
}

export function ProjectData(props: Props) {
  const { setRoute } = useRouter()
  const findClientsCommand = useLazyGet(clientsQuery)
  const [isEditing, setIsEditing] = useState(false)
  const updateProjectCommand = usePut(makeUpdateProjectRequest(props.id))
  const deleteProjectCommand = useDelete(makeDeleteProjectRequest(props.id))
  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  const [project, setProject, getProjectCommand] = useReactiveCommand(
    makeProjectQuery(props.id)
  )

  const [Dialog, deleteProject] = useDialog<void, void, void>(
    () =>
      pipe(
        taskEither.rightIO(() => setError(option.none)),
        taskEither.chain(deleteProjectCommand),
        taskEither.bimap(
          error => pipe(error.message, option.some, setError),
          () => setRoute(projectsRoute('all'))
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
        setProject(project)
      }
    )
  )

  useEffect(() => {
    const fetchProject = getProjectCommand()
    fetchProject()
  }, [getProjectCommand])

  return pipe(
    project,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error.message} />,
      project =>
        pipe(
          isEditing,
          boolean.fold(
            () => (
              <Panel title={project.name} framed action={option.none}>
                <ReadOnlyInput
                  name="name"
                  label={a18n`Name`}
                  value={project.name}
                />
                <ReadOnlyInput
                  name="description"
                  label={a18n`Description`}
                  value={pipe(
                    project.description,
                    option.getOrElse(() => unsafeLocalizedString(''))
                  )}
                />
                <ReadOnlyInput
                  name="client"
                  label={a18n`Client`}
                  value={project.client.name}
                />
                <ReadOnlyInput
                  name="created_at"
                  label={a18n`Created at`}
                  value={formatDateTime(project.created_at)}
                />
                <ReadOnlyInput
                  name="updated_at"
                  label={a18n`Last updated at`}
                  value={formatDateTime(project.updated_at)}
                />
                {pipe(
                  project.cashed,
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
                project={option.some(project)}
                findClients={findClients}
                onSubmit={onSubmit}
                onCancel={onCancel}
              />
            )
          )
        )
    )
  )
}
