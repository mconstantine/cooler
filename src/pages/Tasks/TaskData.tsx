import { boolean, option, taskEither } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { Option } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import { skull } from 'ionicons/icons'
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
import { ProjectLabel, TaskWithStats } from '../../entities/Task'
import { LocalizedString } from '../../globalDomain'
import { makeDeleteTaskRequest, makeUpdateTaskRequest } from './domain'

interface Props {
  task: TaskWithStats
  project: ProjectLabel
  onUpdate: Reader<TaskWithStats, void>
  onDelete: Reader<TaskWithStats, void>
}

export default function TaskData(props: Props) {
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

  return pipe(
    isEditing,
    boolean.fold(
      () => (
        <Panel title={props.task.name} framed action={option.none}>
          <ReadOnlyInput
            name="name"
            label={a18n`Name`}
            value={props.task.name}
          />
          <ReadOnlyInput
            name="description"
            label={a18n`Description`}
            value={pipe(
              props.task.description,
              option.getOrElse(() => unsafeLocalizedString(''))
            )}
          />
          <ReadOnlyInput
            name="project"
            label={a18n`Project`}
            value={props.task.project.name}
          />
          <ReadOnlyInput
            name="startTime"
            label={a18n`Start time`}
            value={formatDateTime(props.task.startTime)}
          />
          <ReadOnlyInput
            name="expectedWorkingHours"
            label={a18n`Expected working hours`}
            value={formatNumber(props.task.expectedWorkingHours)}
          />
          <ReadOnlyInput
            name="hourlyCost"
            label={a18n`Hourly cost`}
            value={formatMoneyAmount(props.task.hourlyCost)}
          />
          <ReadOnlyInput
            name="createdAt"
            label={a18n`Created at`}
            value={formatDateTime(props.task.createdAt)}
          />
          <ReadOnlyInput
            name="updatedAt"
            label={a18n`Last updated at`}
            value={formatDateTime(props.task.updatedAt)}
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
          project={props.project}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      )
    )
  )
}
