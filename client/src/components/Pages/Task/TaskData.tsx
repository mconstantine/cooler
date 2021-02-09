import { boolean, option, readerTaskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { skull } from 'ionicons/icons'
import { FC, useState } from 'react'
import {
  a18n,
  formatDateTime,
  formatMoneyAmount,
  formatNumber
} from '../../../a18n'
import { useDialog } from '../../../effects/useDialog'
import { Task, TaskCreationInput } from '../../../entities/Task'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import { findProjects } from '../../../stories/utils'
import { Button } from '../../Button/Button/Button'
import { Buttons } from '../../Button/Buttons/Buttons'
import { LoadingButton } from '../../Button/LoadingButton/LoadingButton'
import { TaskForm } from '../../Form/Forms/TaskForm'
import { List } from '../../List/List'
import { Panel } from '../../Panel/Panel'

interface Props {
  task: Task
  onChange: ReaderTaskEither<TaskCreationInput, LocalizedString, unknown>
  onDelete: ReaderTaskEither<void, LocalizedString, unknown>
  showProject: Reader<PositiveInteger, unknown>
}

export const TaskData: FC<Props> = props => {
  const [isEditing, setIsEditing] = useState(false)

  const [Dialog, deleteTask] = useDialog(props.onDelete, {
    title: () => a18n`Are you sure you want to delete ${props.task.name}?`,
    message: () => a18n`All task's data (including sessions) will be lost!`
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
        <Panel title={props.task.name} framed action={option.none}>
          <List
            heading={option.none}
            items={[
              ...pipe(
                props.task.description,
                option.fold(
                  () => [],
                  description => [
                    {
                      key: 'description',
                      type: 'readonly' as const,
                      label: option.some(a18n`Description`),
                      content: description,
                      description: option.none
                    }
                  ]
                )
              ),
              {
                key: 'project',
                type: 'routed',
                label: option.some(a18n`Project`),
                content: props.task.project.name,
                description: option.none,
                action: () => props.showProject(props.task.project.id)
              },
              {
                key: 'expectedWorkingHours',
                type: 'readonly',
                label: option.some(a18n`Expected working hours`),
                content: formatNumber(props.task.expectedWorkingHours),
                description: option.none
              },
              {
                key: 'hourlyCost',
                type: 'readonly',
                label: option.some(a18n`Hourly cost`),
                content: formatMoneyAmount(props.task.hourlyCost),
                description: option.none
              },
              {
                key: 'startTime',
                type: 'readonly',
                label: option.some(a18n`Start time`),
                content: formatDateTime(props.task.start_time),
                description: option.none
              },
              {
                key: 'createdAt',
                type: 'readonly',
                label: option.some(a18n`Created at`),
                content: formatDateTime(props.task.created_at),
                description: option.none
              },
              {
                key: 'updatedAt',
                type: 'readonly',
                label: option.some(a18n`Last updated at`),
                content: formatDateTime(props.task.updated_at),
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
              label={a18n`Delete task`}
              action={deleteTask()}
              icon={skull}
              color="danger"
              flat
            />
          </Buttons>
          <Dialog />
        </Panel>
      ),
      () => (
        <TaskForm
          mode="edit"
          task={option.some(props.task)}
          onSubmit={onSubmit}
          findProjects={option.some(findProjects)}
          onCancel={() => setIsEditing(false)}
        />
      )
    )
  )
}
