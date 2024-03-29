import { array, boolean, option, taskEither } from 'fp-ts'
import { IO } from 'fp-ts/IO'
import { constNull, flow, pipe } from 'fp-ts/function'
import { eye, skull, stop } from 'ionicons/icons'
import { a18n, formatDate, formatDateTime } from '../../a18n'
import { ReadOnlyInput } from '../../components/Form/Input/ReadOnlyInput/ReadOnlyInput'
import { Panel } from '../../components/Panel/Panel'
import { SessionCreationInput, Session } from '../../entities/Session'
import { LocalizedString, ObjectId } from '../../globalDomain'
import { useDelete, usePut } from '../../effects/api/useApi'
import {
  makeDeleteSessionRequest,
  makeUpdateSessionRequest
} from '../Tasks/domain'
import { useDialog } from '../../effects/useDialog'
import { Reader } from 'fp-ts/Reader'
import { useEffect, useState } from 'react'
import { Option } from 'fp-ts/Option'
import { Buttons } from '../../components/Button/Buttons/Buttons'
import { Button } from '../../components/Button/Button/Button'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { SessionForm } from '../../components/Form/Forms/SessionForms'
import { useSessionDurationClock } from '../../effects/useSessionDurationClock'
import { TaskEither } from 'fp-ts/TaskEither'
import { LoadingButton } from '../../components/Button/LoadingButton/LoadingButton'
import { useCurrentSessions } from '../../contexts/CurrentSessionsContext'
import {
  clientsRoute,
  projectsRoute,
  taskRoute,
  useRouter
} from '../../components/Router'

interface Props {
  session: Session
  taskId: ObjectId
  onUpdate: Reader<Session, unknown>
  onDelete: Reader<Session, unknown>
  onCancel: IO<unknown>
}

export function SessionData(props: Props) {
  const { setRoute } = useRouter()
  const { currentSessions, notifyStoppedSession, notifyDeletedSession } =
    useCurrentSessions()

  const {
    duration,
    start: startClock,
    stop: stopClock
  } = useSessionDurationClock(props.session, false)

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
      task: props.session.task._id,
      endTime: option.some(new Date())
    }),
    taskEither.chain(session =>
      taskEither.fromIO(() => {
        props.onUpdate(session)
        notifyStoppedSession(session)
      })
    )
  )

  const onCancel: IO<void> = () => setIsEditing(false)

  const [Dialog, deleteSession] = useDialog<Session, void, unknown>(
    () =>
      pipe(
        taskEither.rightIO(() => setError(option.none)),
        taskEither.chain(deleteSessionCommand),
        taskEither.bimap(
          error => pipe(error, option.some, setError),
          session => {
            notifyDeletedSession(session)
            props.onDelete(session)
          }
        )
      ),
    {
      title: () => a18n`Are you sure you want to delete this session?`,
      message: () => a18n`All your precious working time will be lost!`
    }
  )

  useEffect(() => {
    pipe(
      currentSessions,
      option.fold(
        stopClock,
        flow(
          array.findFirst(
            currentSession => currentSession._id === props.session._id
          ),
          option.fold(stopClock, startClock)
        )
      )
    )
  }, [currentSessions, props.session._id, startClock, stopClock])

  return pipe(
    isEditing,
    boolean.fold(
      () => (
        <Panel
          framed
          actions={option.none}
          title={formatDate(props.session.startTime)}
        >
          <ReadOnlyInput
            name="startTime"
            label={a18n`Started at`}
            value={formatDateTime(props.session.startTime)}
            action={option.none}
          />
          <ReadOnlyInput
            name="endTime"
            label={a18n`Ended at`}
            value={pipe(
              props.session.endTime,
              option.map(formatDateTime),
              option.getOrElse(() => a18n`Currently running`)
            )}
            action={option.none}
          />
          <ReadOnlyInput
            name="duration"
            label={a18n`Duration`}
            value={duration}
            action={option.none}
          />
          <ReadOnlyInput
            name="task"
            label={a18n`Task`}
            value={props.session.task.name}
            action={option.some({
              type: 'sync',
              label: a18n`Details`,
              action: _ =>
                setRoute(
                  taskRoute(props.session.project._id, props.session.task._id),
                  _
                ),
              icon: option.some(eye)
            })}
          />
          <ReadOnlyInput
            name="project"
            label={a18n`Project`}
            value={props.session.project.name}
            action={option.some({
              type: 'sync',
              label: a18n`Details`,
              action: _ =>
                setRoute(projectsRoute(props.session.project._id), _),
              icon: option.some(eye)
            })}
          />
          <ReadOnlyInput
            name="client"
            label={a18n`Client`}
            value={props.session.client.name}
            action={option.some({
              type: 'sync',
              label: a18n`Details`,
              action: _ => setRoute(clientsRoute(props.session.client._id), _),
              icon: option.some(eye)
            })}
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
                    label={option.some(a18n`Stop`)}
                    action={() => onStop}
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
              label={option.some(a18n`Delete session`)}
              action={() => deleteSession(props.session)}
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
