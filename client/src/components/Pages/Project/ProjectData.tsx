import { boolean, option, readerTaskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { skull } from 'ionicons/icons'
import { FC, useState } from 'react'
import { a18n, formatDateTime } from '../../../a18n'
import { useDialog } from '../../../effects/useDialog'
import { Project, ProjectCreationInput } from '../../../entities/Project'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import { Button } from '../../Button/Button/Button'
import { Buttons } from '../../Button/Buttons/Buttons'
import { LoadingButton } from '../../Button/LoadingButton/LoadingButton'
import { ProjectForm } from '../../Form/Forms/ProjectForm'
import { List, ReadonlyItem } from '../../List/List'
import { Panel } from '../../Panel/Panel'

interface Props {
  project: Project
  onChange: ReaderTaskEither<ProjectCreationInput, LocalizedString, unknown>
  onDelete: ReaderTaskEither<void, LocalizedString, unknown>
  findClients: ReaderTaskEither<
    string,
    LocalizedString,
    Record<PositiveInteger, LocalizedString>
  >
  showClient: Reader<PositiveInteger, unknown>
}

export const ProjectData: FC<Props> = props => {
  const [isEditing, setIsEditing] = useState(false)

  const [Dialog, deleteProject] = useDialog(props.onDelete, {
    title: () => a18n`Are you sure you want to delete ${props.project.name}?`,
    message: () =>
      a18n`All project's data (including tasks and sessions) will be lost!`
  })

  const onSubmit = pipe(
    props.onChange,
    readerTaskEither.chain(() =>
      readerTaskEither.fromIO(() => setIsEditing(false))
    )
  )

  return pipe(
    isEditing,
    boolean.fold(
      () => (
        <Panel title={props.project.name} framed action={option.none}>
          <List
            heading={option.none}
            items={[
              ...pipe(
                props.project.description,
                option.fold<LocalizedString, ReadonlyItem[]>(
                  () => [],
                  description => [
                    {
                      type: 'readonly',
                      key: 'name',
                      label: option.some(a18n`Description`),
                      content: description,
                      description: option.none
                    }
                  ]
                )
              ),
              {
                type: 'routed',
                key: 'client',
                label: option.some(a18n`Client`),
                content: props.project.client.name,
                description: option.none,
                action: () => props.showClient(props.project.client.id)
              },
              {
                type: 'readonly',
                key: 'createdAt',
                label: option.some(a18n`Created at`),
                content: formatDateTime(props.project.created_at),
                description: option.none
              },
              {
                type: 'readonly',
                key: 'updatedAt',
                label: option.some(a18n`Last updated at`),
                content: formatDateTime(props.project.updated_at),
                description: option.none
              }
            ]}
          />
          <Buttons spacing="spread">
            <Button
              type="button"
              label={a18n`Edit`}
              action={() => setIsEditing(true)}
              icon={option.none}
              color="primary"
            />
            <LoadingButton
              type="button"
              label={a18n`Delete project`}
              action={deleteProject()}
              icon={skull}
              color="danger"
              flat
            />
          </Buttons>
          <Dialog />
        </Panel>
      ),
      () => (
        <ProjectForm
          project={option.some(props.project)}
          findClients={props.findClients}
          onSubmit={onSubmit}
          onCancel={() => setIsEditing(false)}
        />
      )
    )
  )
}
