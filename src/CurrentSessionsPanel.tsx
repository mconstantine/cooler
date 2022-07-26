import { boolean, option } from 'fp-ts'
import {
  constant,
  constFalse,
  constNull,
  constTrue,
  constVoid,
  pipe
} from 'fp-ts/function'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { eye } from 'ionicons/icons'
import { useEffect, useMemo, useState } from 'react'
import { a18n, formatDuration } from './a18n'
import { Panel } from './components/Panel/Panel'
import {
  currentSessionsRoute,
  foldLocation,
  foldRouteSubject,
  taskRoute,
  useRouter
} from './components/Router'
import { useCurrentSessions } from './contexts/CurrentSessionsContext'
import { SessionWithTaskLabel } from './entities/Session'
import { LocalizedString } from './globalDomain'

export function CurrentSessionsPanel() {
  const { currentSessions } = useCurrentSessions()
  const { route, setRoute } = useRouter()

  const shouldShowPanelInThisRoute = useMemo(
    () =>
      pipe(
        currentSessions,
        option.fold(constFalse, sessions =>
          pipe(
            route,
            foldLocation({
              Home: constTrue,
              Clients: constTrue,
              Projects: constTrue,
              Settings: constTrue,
              Task: ({ subject }) =>
                pipe(
                  sessions.length === 1,
                  boolean.fold(constTrue, () =>
                    pipe(
                      subject,
                      foldRouteSubject(
                        constFalse,
                        constFalse,
                        _id => sessions[0].task._id !== _id
                      )
                    )
                  )
                ),
              CurrentSessions: constFalse
            })
          )
        )
      ),
    [currentSessions, route]
  )

  const [message, setMessage] = useState(
    pipe(
      shouldShowPanelInThisRoute,
      boolean.fold(
        () => option.none,
        () => pipe(currentSessions, option.map(getMessage))
      )
    )
  )

  useEffect(() => {
    const interval = pipe(
      shouldShowPanelInThisRoute,
      boolean.fold(
        () => option.none,
        () =>
          pipe(
            currentSessions,
            option.chain(sessions =>
              pipe(
                sessions.length === 1,
                boolean.fold(
                  () => option.none,
                  () =>
                    option.some(
                      window.setInterval(
                        () => setMessage(option.some(getMessage(sessions))),
                        1000
                      )
                    )
                )
              )
            )
          )
      )
    )

    return () => {
      pipe(
        interval,
        option.fold(constVoid, interval => window.clearInterval(interval))
      )
    }
  }, [currentSessions, shouldShowPanelInThisRoute])

  useEffect(() => {
    setMessage(
      pipe(
        shouldShowPanelInThisRoute,
        boolean.fold(
          () => option.none,
          () => pipe(currentSessions, option.map(getMessage))
        )
      )
    )
  }, [currentSessions, shouldShowPanelInThisRoute])

  return pipe(
    message,
    option.fold(constNull, message => (
      <Panel
        color="warning"
        framed
        title={message}
        action={pipe(
          currentSessions,
          option.map(sessions => ({
            type: 'sync',
            icon: option.some(eye),
            label: a18n`Details`,
            action: pipe(
              sessions.length === 1,
              boolean.fold(
                constant(() => setRoute(currentSessionsRoute())),
                constant(() =>
                  setRoute(
                    taskRoute(sessions[0].task.project, sessions[0].task._id)
                  )
                )
              )
            )
          }))
        )}
      />
    ))
  )
}

function getMessage(
  sessions: NonEmptyArray<SessionWithTaskLabel>
): LocalizedString {
  return pipe(
    sessions.length === 1,
    boolean.fold(
      () => a18n`${sessions.length} started sessions`,
      () => {
        const duration = formatDuration(
          Date.now() - sessions[0].startTime.getTime(),
          true
        )
        return a18n`One started session (${duration})`
      }
    )
  )
}
