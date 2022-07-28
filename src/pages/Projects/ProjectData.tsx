import { boolean, option, taskEither } from 'fp-ts'
import { constNull, flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { useState } from 'react'
import {
  a18n,
  formatDate,
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
import { useDelete, usePut } from '../../effects/api/useApi'
import {
  Project,
  ProjectCreationInput,
  ProjectWithStats
} from '../../entities/Project'
import { LocalizedString } from '../../globalDomain'
import { makeDeleteProjectRequest, makeUpdateProjectRequest } from './domain'
import { LoadingButton } from '../../components/Button/LoadingButton/LoadingButton'
import { arrowUp, skull } from 'ionicons/icons'
import { useDialog } from '../../effects/useDialog'
import { Option } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import { useTaxes } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { List } from '../../components/List/List'
import { calculateNetValue, renderTaxItem } from '../Profile/utils'
import { useFindClients } from './useFindClients'
import { clientsRoute, useRouter } from '../../components/Router'

interface Props {
  project: ProjectWithStats
  onUpdate: Reader<ProjectWithStats, void>
  onDelete: Reader<Project, void>
}

export function ProjectData(props: Props) {
  const { taxes } = useTaxes()
  const findClients = useFindClients()
  const { setRoute } = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  const updateProjectCommand = usePut(
    makeUpdateProjectRequest(props.project._id)
  )

  const deleteProjectCommand = useDelete(
    makeDeleteProjectRequest(props.project._id)
  )

  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  const [Dialog, deleteProject] = useDialog<ProjectWithStats, void, void>(
    () =>
      pipe(
        taskEither.rightIO(() => setError(option.none)),
        taskEither.chain(deleteProjectCommand),
        taskEither.bimap(
          error => pipe(error, option.some, setError),
          props.onDelete
        )
      ),
    {
      title: project =>
        a18n`Are you sure you want to delete the project "${project.name}"?`,
      message: () => a18n`All your data, tasks and sessions will be deleted!`
    }
  )

  const onCancel: IO<void> = () => setIsEditing(false)

  const onSubmit: ReaderTaskEither<
    ProjectCreationInput,
    LocalizedString,
    void
  > = flow(
    updateProjectCommand,
    taskEither.map(project => {
      setIsEditing(false)
      props.onUpdate(project)
    })
  )

  return pipe(
    isEditing,
    boolean.fold(
      () => (
        <Panel
          title={props.project.name}
          framed
          action={option.some({
            type: 'sync',
            label: a18n`Back to client`,
            action: () => setRoute(clientsRoute(props.project.client._id)),
            icon: option.some(arrowUp)
          })}
        >
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
            name="createdAt"
            label={a18n`Created at`}
            value={formatDateTime(props.project.createdAt)}
          />
          <ReadOnlyInput
            name="updatedAt"
            label={a18n`Last updated at`}
            value={formatDateTime(props.project.updatedAt)}
          />
          {pipe(
            props.project.cashData,
            option.fold(
              () => (
                <ReadOnlyInput
                  name="cashedStatus"
                  label={a18n`Cashed status`}
                  value={a18n`Not cashed`}
                />
              ),
              ({ at, amount }) =>
                pipe(
                  taxes,
                  query.fold(
                    () => <LoadingBlock />,
                    error => <ErrorPanel error={error} />,
                    taxes => (
                      <List
                        heading={option.some(a18n`Cashed`)}
                        emptyListMessage={unsafeLocalizedString('')}
                        items={[
                          {
                            key: 'cashedAt',
                            type: 'valued',
                            label: option.none,
                            content: a18n`Cashed at`,
                            description: option.none,
                            value: formatDate(at),
                            progress: option.none
                          },
                          {
                            key: 'grossCashedAmount',
                            type: 'valued',
                            label: option.none,
                            content: a18n`Cashed amount (gross)`,
                            description: option.none,
                            value: formatMoneyAmount(amount),
                            progress: option.none
                          },
                          ...taxes.map(tax =>
                            renderTaxItem('cashedAmount', amount, tax)
                          ),
                          {
                            key: 'netCashedAmount',
                            type: 'valued',
                            label: option.none,
                            content: a18n`Cashed amount (net)`,
                            description: option.none,
                            value: formatMoneyAmount(
                              calculateNetValue(amount, taxes)
                            ),
                            progress: option.none
                          }
                        ]}
                      />
                    )
                  )
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
              type="loadingButton"
              label={a18n`Delete project`}
              color="danger"
              flat
              action={deleteProject(props.project)}
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
