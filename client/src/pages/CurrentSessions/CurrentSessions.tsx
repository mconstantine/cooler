import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { a18n, formatDuration } from '../../a18n'
import { List, RoutedItem } from '../../components/List/List'
import { Panel } from '../../components/Panel/Panel'
import { sessionRoute, useRouter } from '../../components/Router'
import { useCurrentSessions } from '../../contexts/CurrentSessionsContext'
import { useSessionsClock } from '../../effects/useSessionDurationClock'
import { Session } from '../../entities/Session'

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
  sessions: NonEmptyArray<Session>
}

function NonEmptyCurrentSessions(props: NonEmptyCurrentSessionsProps) {
  const sessionsWithDuration = useSessionsClock(props.sessions)
  const { setRoute } = useRouter()

  return (
    <Panel title={a18n`Current sessions`} actions={option.none} framed>
      <List
        heading={option.none}
        emptyListMessage={a18n`No sessions are currently running`}
        items={sessionsWithDuration.map(
          (session): RoutedItem => ({
            type: 'routed',
            key: session._id,
            label: option.some(session.task.name),
            content: formatDuration(session.duration, true),
            description: option.none,
            action: () =>
              setRoute(
                sessionRoute(session.project._id, session.task._id, session._id)
              ),
            details: true
          })
        )}
      />
    </Panel>
  )
}
