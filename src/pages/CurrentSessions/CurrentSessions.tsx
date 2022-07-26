import { array, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { useEffect, useMemo, useState } from 'react'
import { a18n, formatDuration } from '../../a18n'
import { List, RoutedItem } from '../../components/List/List'
import { Panel } from '../../components/Panel/Panel'
import { taskRoute, useRouter } from '../../components/Router'
import { useCurrentSessions } from '../../contexts/CurrentSessionsContext'
import { SessionWithTaskLabel } from '../../entities/Session'

type SessionWithDuration = SessionWithTaskLabel & { duration: number }

export function CurrentSessions() {
  const { currentSessions } = useCurrentSessions()
  const { setRoute } = useRouter()
  const [time, setTime] = useState(Date.now())

  const sessionsWithDuration: SessionWithDuration[] = useMemo(
    () =>
      pipe(
        currentSessions,
        option.getOrElse<SessionWithTaskLabel[]>(() => []),
        array.map(session => ({
          ...session,
          duration: time - session.startTime.getTime()
        }))
      ),
    [currentSessions, time]
  )

  useEffect(() => {
    const interval = pipe(
      currentSessions,
      option.map(() => window.setInterval(() => setTime(Date.now()), 1000))
    )

    return () => {
      pipe(
        interval,
        option.fold(constVoid, interval => window.clearInterval(interval))
      )
    }
  }, [currentSessions])

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
            content: formatDuration(
              Date.now() - session.startTime.getTime(),
              true
            ),
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
