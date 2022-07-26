import { boolean, option, taskEither } from 'fp-ts'
import { IO } from 'fp-ts/IO'
import { constNull, constVoid, pipe } from 'fp-ts/function'
import { arrowUp, skull, stop } from 'ionicons/icons'
import { a18n, formatDate, formatDateTime } from '../../a18n'
import { ReadOnlyInput } from '../../components/Form/Input/ReadOnlyInput/ReadOnlyInput'
import { Panel } from '../../components/Panel/Panel'
import { Session, SessionCreationInput } from '../../entities/Session'
import { LocalizedString, ObjectId } from '../../globalDomain'
import { useDelete, usePut } from '../../effects/api/useApi'
import { makeDeleteSessionRequest, makeUpdateSessionRequest } from './domain'
import { useDialog } from '../../effects/useDialog'
import { Reader } from 'fp-ts/Reader'
import { useState } from 'react'
import { Option } from 'fp-ts/Option'
import { Buttons } from '../../components/Button/Buttons/Buttons'
import { Button } from '../../components/Button/Button/Button'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { SessionForm } from '../../components/Form/Forms/SessionForms'
import { useSessionDurationClock } from '../../effects/useSessionDurationClock'
import { TaskEither } from 'fp-ts/TaskEither'
import { LoadingButton } from '../../components/Button/LoadingButton/LoadingButton'

interface Props {
  session: Session
  taskId: ObjectId
  onUpdate: Reader<Session, unknown>
  onDelete: Reader<Session, unknown>
  onCancel: IO<unknown>
}

export function SessionPage(props: Props) {
  const duration = useSessionDurationClock(props.session)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  const updateSessionCommand = usePut(
    makeUpdateSessionRequest(props.session._id)
  )

  const deleteSessionCommand = useDelete(
    makeDeleteSessionRequest(props.session._id)
  )

  const onSubmit: ReaderTaskEither<
    SessionCreationInput,
    LocalizedString,
    void
  > = data =>
    pipe(
      updateSessionCommand(data),
      taskEither.chain(session =>
        taskEither.fromIO(() => {
          props.onUpdate(session)
          setIsEditing(false)
        })
      )
    )

  const onStop: TaskEither<LocalizedString, void> = pipe(
    updateSessionCommand({
      ...props.session,
      endTime: option.some(new Date())
    }),
    taskEither.chain(() => taskEither.fromIO(constVoid))
  )

  const onCancel: IO<void> = () => setIsEditing(false)

  const [Dialog, deleteSession] = useDialog<Session, void, unknown>(
    () =>
      pipe(
        taskEither.rightIO(() => setError(option.none)),
        taskEither.chain(deleteSessionCommand),
        taskEither.bimap(
          error => pipe(error, option.some, setError),
          props.onDelete
        )
      ),
    {
      title: () => a18n`Are you sure you want to delete this session?`,
      message: () => a18n`All your precious working time will be lost!`
    }
  )

  return pipe(
    isEditing,
    boolean.fold(
      () => (
        <Panel
          framed
          action={option.some({
            type: 'sync',
            label: a18n`Back to task`,
            icon: option.some(arrowUp),
            action: props.onCancel
          })}
          title={formatDate(props.session.startTime)}
        >
          <ReadOnlyInput
            name="startTime"
            label={a18n`Started at`}
            value={formatDateTime(props.session.startTime)}
          />
          <ReadOnlyInput
            name="endTime"
            label={a18n`Ended at`}
            value={pipe(
              props.session.endTime,
              option.map(formatDateTime),
              option.getOrElse(() => a18n`Currently running`)
            )}
          />
          <ReadOnlyInput
            name="duration"
            label={a18n`Duration`}
            value={duration}
          />
          {pipe(
            error,
            option.fold(constNull, error => <ErrorPanel error={error} />)
          )}
          <Dialog />
          <Buttons>
            {pipe(
              props.session.endTime,
              option.fold(
                () => (
                  <LoadingButton
                    type="loadingButton"
                    icon={stop}
                    color="primary"
                    label={a18n`Stop`}
                    action={onStop}
                  />
                ),
                () => (
                  <Button
                    type="button"
                    icon={option.none}
                    color="primary"
                    label={a18n`Edit`}
                    action={() => setIsEditing(true)}
                  />
                )
              )
            )}
            <LoadingButton
              type="loadingButton"
              icon={skull}
              color="danger"
              label={a18n`Delete session`}
              action={deleteSession(props.session)}
            />
          </Buttons>
        </Panel>
      ),
      () => (
        <SessionForm
          session={option.some(props.session)}
          taskId={props.taskId}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )
    )
  )
}
