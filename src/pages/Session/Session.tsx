import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { useEffect } from 'react'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { taskRoute, useRouter } from '../../components/Router'
import { query } from '../../effects/api/api'
import { useReactiveCommand } from '../../effects/api/useApi'
import { Session as SessionC } from '../../entities/Session'
import { ObjectId } from '../../globalDomain'
import { makeGetSessionRequest } from './domain'
import { SessionData } from './SessionData'

interface Props {
  projectId: ObjectId
  taskId: ObjectId
  _id: ObjectId
}

export default function Session(props: Props) {
  const { setRoute } = useRouter()
  const [session, setSession, fetchSessionCommand] = useReactiveCommand(
    makeGetSessionRequest(props._id)
  )

  const onUpdate: Reader<SessionC, void> = setSession

  const backToTask: IO<void> = () =>
    setRoute(taskRoute(props.projectId, props.taskId))

  useEffect(() => {
    const fetchSession = fetchSessionCommand()
    fetchSession()
  }, [fetchSessionCommand])

  return pipe(
    session,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      session => (
        <SessionData
          session={session}
          taskId={props.taskId}
          onUpdate={onUpdate}
          onDelete={backToTask}
          onCancel={backToTask}
        />
      )
    )
  )
}
