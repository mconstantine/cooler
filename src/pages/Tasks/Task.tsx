import { option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { LocalizedString, ObjectId } from '../../globalDomain'
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

  const onUpdate: Reader<TaskWithStats, void> = setTask

  const onDelete: Reader<TaskWithStats, void> = task =>
    setRoute(projectsRoute(task.project._id))

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
          <TaskProgress task={task} />
          <SessionsList
            task={task}
            onCreateSessionButtonClick={onCreateSessionButtonClick}
          />
        </TaxesProvider>
      )
    )
  )
}
