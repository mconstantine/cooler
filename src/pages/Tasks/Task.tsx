import { pipe } from 'fp-ts/function'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { Loading } from '../../components/Loading/Loading'
import { query } from '../../effects/api/api'
import { useGet } from '../../effects/api/useApi'
import { ObjectId } from '../../globalDomain'
import { makeTaskQuery } from './domain'
import TaskData from './TaskData'

interface Props {
  _id: ObjectId
}

export default function Task(props: Props) {
  const [task] = useGet(makeTaskQuery(props._id))

  return pipe(
    task,
    query.fold(
      () => <Loading />,
      error => <ErrorPanel error={error} />,
      task => <TaskData task={task} />
    )
  )
}
