import { option, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import {
  LocalizedString,
  ObjectId,
  unsafeNonNegativeNumber
} from '../../globalDomain'
import { usePost, useReactiveCommand } from '../../effects/api/useApi'
import { makeTaskQuery, startSessionRequest } from './domain'
import { useCurrentSessions } from '../../contexts/CurrentSessionsContext'
import { projectsRoute, useRouter } from '../../components/Router'
import { TaskWithStats } from '../../entities/Task'
import { Reader } from 'fp-ts/Reader'
import { useEffect } from 'react'
import { query } from '../../effects/api/api'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { TaxesProvider } from '../../contexts/TaxesContext'
import TaskData from './TaskData'
import { TaskProgress } from './TaskProgress'
import { SessionsList } from './SessionsList'
import { Session } from '../../entities/Session'
import { TaskSiblings } from './TaskSiblings'

interface Props {
  _id: ObjectId
}

export default function Task(props: Props) {
  const { setRoute } = useRouter()
  const { notifyStartedSession } = useCurrentSessions()
  const startSessionCommand = usePost(startSessionRequest)

  const [task, setTask, getTaskCommand] = useReactiveCommand(
    makeTaskQuery(props._id)
  )

  const onCreateSessionButtonClick: TaskEither<LocalizedString, void> = pipe(
    taskEither.rightIO(() => new Date()),
    taskEither.chain(startTime =>
      startSessionCommand({
        task: props._id,
        startTime,
        endTime: option.none
      })
    ),
    taskEither.chain(session =>
      taskEither.fromIO(() => notifyStartedSession(session))
    )
  )

  const onWorkingHoursAdded: Reader<Session, void> = session =>
    pipe(
      session.endTime,
      option.fold(constVoid, endTime => {
        const sessionDuration =
          (endTime.getTime() - session.startTime.getTime()) / 3600000

        return pipe(
          task,
          query.fold(constVoid, constVoid, task =>
            setTask({
              ...task,
              actualWorkingHours: unsafeNonNegativeNumber(
                task.actualWorkingHours + sessionDuration
              )
            })
          )
        )
      })
    )

  const onUpdate: Reader<TaskWithStats, void> = setTask

  const onDelete: Reader<TaskWithStats, void> = task =>
    setRoute(projectsRoute(task.project._id), false)

  useEffect(() => {
    const fetchTask = getTaskCommand()
    fetchTask()
  }, [getTaskCommand])

  return pipe(
    task,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      task => (
        <TaxesProvider>
          <TaskData task={task} onUpdate={onUpdate} onDelete={onDelete} />
          <TaskSiblings task={task} />
          <TaskProgress task={task} />
          <SessionsList
            task={task}
            onCreateSessionButtonClick={onCreateSessionButtonClick}
            onWorkingHoursAdded={onWorkingHoursAdded}
          />
        </TaxesProvider>
      )
    )
  )
}
