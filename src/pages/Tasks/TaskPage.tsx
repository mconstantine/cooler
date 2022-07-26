import { pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { useEffect } from 'react'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { projectsRoute, useRouter } from '../../components/Router'
import { TaxesProvider } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { useReactiveCommand } from '../../effects/api/useApi'
import { TaskWithStats } from '../../entities/Task'
import { makeTaskQuery } from './domain'
import { SessionsList } from './SessionsList'
import TaskData from './TaskData'
import { TaskProgress } from './TaskProgress'
import { LocalizedString, ObjectId } from '../../globalDomain'
import { Session } from '../../entities/Session'
import { TaskEither } from 'fp-ts/TaskEither'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'

interface Props {
  _id: ObjectId
  onCreateSessionButtonClick: TaskEither<LocalizedString, void>
  onSessionListItemClick: Reader<Session, unknown>
}

export function TaskPage(props: Props) {
  const { setRoute } = useRouter()

  const [task, setTask, getTaskCommand] = useReactiveCommand(
    makeTaskQuery(props._id)
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
          <TaskData
            task={task}
            project={task.project}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
          <TaskProgress task={task} />
          <SessionsList
            task={task}
            onCreateSessionButtonClick={props.onCreateSessionButtonClick}
            onSessionListItemClick={props.onSessionListItemClick}
          />
        </TaxesProvider>
      )
    )
  )
}
