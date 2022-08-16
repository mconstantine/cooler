import { taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import {
  foldFormData,
  FormData,
  TaskForm
} from '../../components/Form/Forms/TaskForm'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { projectsRoute, taskRoute, useRouter } from '../../components/Router'
import { query } from '../../effects/api/api'
import { useGet, usePost } from '../../effects/api/useApi'
import { LocalizedString, ObjectId } from '../../globalDomain'
import { makeGetProjectQuery } from '../Projects/domain'
import { makeCreateTaskRequest, makeCreateTasksBatchRequest } from './domain'

interface Props {
  project: ObjectId
}

export function TaskCreation(props: Props) {
  const [project] = useGet(makeGetProjectQuery(props.project))
  const createTask = usePost(makeCreateTaskRequest)
  const createTasksBatch = usePost(makeCreateTasksBatchRequest)
  const { setRoute } = useRouter()

  const onSubmit: ReaderTaskEither<FormData, LocalizedString, void> = data => {
    return pipe(
      data,
      foldFormData(
        flow(
          createTask,
          taskEither.chain(task =>
            taskEither.fromIO(() =>
              setRoute(taskRoute(props.project, task._id), false)
            )
          )
        ),
        flow(
          createTasksBatch,
          taskEither.chain(() =>
            taskEither.fromIO(() =>
              setRoute(projectsRoute(props.project), false)
            )
          )
        )
      )
    )
  }

  const onCancel: IO<void> = () => setRoute(projectsRoute(props.project), false)

  return pipe(
    project,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      project => (
        <TaskForm
          mode="add"
          project={project}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )
    )
  )
}
