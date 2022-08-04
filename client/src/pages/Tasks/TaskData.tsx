import { boolean, option, taskEither } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { Option } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import { arrowUp, eye, skull } from 'ionicons/icons'
import { useState } from 'react'
import {
  a18n,
  formatDateTime,
  formatMoneyAmount,
  formatNumber,
  unsafeLocalizedString
} from '../../a18n'
import { Button } from '../../components/Button/Button/Button'
import { Buttons } from '../../components/Button/Buttons/Buttons'
import { LoadingButton } from '../../components/Button/LoadingButton/LoadingButton'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import {
  SingleTaskFormData,
  TaskForm
} from '../../components/Form/Forms/TaskForm'
import { ReadOnlyInput } from '../../components/Form/Input/ReadOnlyInput/ReadOnlyInput'
import { Panel } from '../../components/Panel/Panel'
import { useDelete, usePut } from '../../effects/api/useApi'
import { useDialog } from '../../effects/useDialog'
import { TaskWithStats } from '../../entities/Task'
import { LocalizedString } from '../../globalDomain'
import { makeDeleteTaskRequest, makeUpdateTaskRequest } from './domain'
import { clientsRoute, projectsRoute, useRouter } from '../../components/Router'

interface Props {
  task: TaskWithStats
  onUpdate: Reader<TaskWithStats, void>
  onDelete: Reader<TaskWithStats, void>
}

export default function TaskData(props: Props) {
  const { setRoute } = useRouter()
  const updateTaskCommand = usePut(makeUpdateTaskRequest(props.task._id))
  const deleteTaskCommand = useDelete(makeDeleteTaskRequest(props.task._id))
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  const [Dialog, deleteTask] = useDialog<TaskWithStats, void, void>(
    () =>
      pipe(
        taskEither.rightIO(() => setError(option.none)),
        taskEither.chain(deleteTaskCommand),
        taskEither.bimap(
          error => pipe(error, option.some, setError),
          props.onDelete
        )
      ),
    {
      title: task =>
        a18n`Are you sure you want to delete the task "${task.name}"?`,
      message: () => a18n`All your data and sessions will be deleted!`
    }
  )

  const onCancel: IO<void> = () => setIsEditing(false)

  const onSubmit: ReaderTaskEither<
    SingleTaskFormData,
    LocalizedString,
    void
  > = data =>
    pipe(
      updateTaskCommand(data),
      taskEither.chain(task =>
        taskEither.fromIO(() => {
          props.onUpdate(task)
          setIsEditing(false)
        })
      )
    )

  const backToProject: IO<void> = () =>
    setRoute(projectsRoute(props.task.project._id))

  return pipe(
    isEditing,
    boolean.fold(
      () => (
        <Panel
          title={props.task.name}
          framed
          action={option.some({
            type: 'sync',
            label: a18n`Back to project`,
            icon: option.some(arrowUp),
            action: backToProject
          })}
        >
          <ReadOnlyInput
            name="name"
            label={a18n`Name`}
            value={props.task.name}
            action={option.none}
          />
          <ReadOnlyInput
            name="description"
            label={a18n`Description`}
            value={pipe(
              props.task.description,
              option.getOrElse(() => unsafeLocalizedString(''))
            )}
            action={option.none}
          />
          <ReadOnlyInput
            name="project"
            label={a18n`Project`}
            value={props.task.project.name}
            action={option.some({
              type: 'sync',
              label: a18n`Details`,
              action: () => setRoute(projectsRoute(props.task.project._id)),
              icon: option.some(eye)
            })}
          />
          <ReadOnlyInput
            name="client"
            label={a18n`Client`}
            value={props.task.client.name}
            action={option.some({
              type: 'sync',
              label: a18n`Details`,
              action: () => setRoute(clientsRoute(props.task.client._id)),
              icon: option.some(eye)
            })}
          />
          <ReadOnlyInput
            name="startTime"
            label={a18n`Start time`}
            value={formatDateTime(props.task.startTime)}
            action={option.none}
          />
          <ReadOnlyInput
            name="expectedWorkingHours"
            label={a18n`Expected working hours`}
            value={formatNumber(props.task.expectedWorkingHours)}
            action={option.none}
          />
          <ReadOnlyInput
            name="hourlyCost"
            label={a18n`Hourly cost`}
            value={formatMoneyAmount(props.task.hourlyCost)}
            action={option.none}
          />
          <ReadOnlyInput
            name="createdAt"
            label={a18n`Created at`}
            value={formatDateTime(props.task.createdAt)}
            action={option.none}
          />
          <ReadOnlyInput
            name="updatedAt"
            label={a18n`Last updated at`}
            value={formatDateTime(props.task.updatedAt)}
            action={option.none}
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
              label={a18n`Delete task`}
              color="danger"
              flat
              action={deleteTask(props.task)}
              icon={skull}
            />
          </Buttons>
          <Dialog />
        </Panel>
      ),
      () => (
        <TaskForm
          mode="edit"
          task={props.task}
          project={props.task.project}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      )
    )
  )
}
