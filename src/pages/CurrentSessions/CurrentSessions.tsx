import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { a18n } from '../../a18n'
import { List, RoutedItem } from '../../components/List/List'
import { Panel } from '../../components/Panel/Panel'
import { taskRoute, useRouter } from '../../components/Router'
import { useCurrentSessions } from '../../contexts/CurrentSessionsContext'
import { useSessionsListClock } from '../../effects/useSessionDurationClock'
import { SessionWithTaskLabel } from '../../entities/Session'

export function CurrentSessions() {
  const { currentSessions } = useCurrentSessions()

  return pipe(
    currentSessions,
    option.fold(
      () => <EmptyCurrentSessions />,
      sessions => <NonEmptyCurrentSessions sessions={sessions} />
    )
  )
}

function EmptyCurrentSessions() {
  return null
}

interface NonEmptyCurrentSessionsProps {
  sessions: NonEmptyArray<SessionWithTaskLabel>
}

function NonEmptyCurrentSessions(props: NonEmptyCurrentSessionsProps) {
  const sessionsWithDuration = useSessionsListClock(props.sessions)
  const { setRoute } = useRouter()

  return (
    <Panel title={a18n`Current sessions`} action={option.none} framed>
      <List
        heading={option.none}
        emptyListMessage={a18n`No sessions are currently running`}
        items={sessionsWithDuration.map(
          (session): RoutedItem => ({
            type: 'routed',
            key: session._id,
            label: option.some(session.task.name),
            content: session.duration,
            description: option.none,
            action: () =>
              setRoute(taskRoute(session.task.project, session.task._id)),
            details: true
          })
        )}
      />
    </Panel>
  )
}
