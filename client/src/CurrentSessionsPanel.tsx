import { boolean, option } from 'fp-ts'
import { constFalse, constNull, constTrue, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { eye } from 'ionicons/icons'
import { useMemo } from 'react'
import { a18n } from './a18n'
import { Panel } from './components/Panel/Panel'
import {
  currentSessionsRoute,
  foldLocation,
  foldRouteSubject,
  sessionRoute,
  useRouter
} from './components/Router'
import { useCurrentSessions } from './contexts/CurrentSessionsContext'
import { Session } from './entities/Session'
import { useSessionDurationClock } from './effects/useSessionDurationClock'

export function CurrentSessionsPanel() {
  const { currentSessions } = useCurrentSessions()
  const { route } = useRouter()

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
              Session: ({ subject }) =>
                pipe(
                  sessions.length === 1,
                  boolean.fold(constTrue, () => sessions[0]._id !== subject)
                ),
              CurrentSessions: constFalse,
              NotFound: constFalse
            })
          )
        )
      ),
    [currentSessions, route]
  )

  return pipe(
    shouldShowPanelInThisRoute,
    boolean.fold(constNull, () => <MessagePanel sessions={currentSessions} />)
  )
}

interface MessageProps {
  sessions: Option<NonEmptyArray<Session>>
}

function MessagePanel(props: MessageProps) {
  return pipe(
    props.sessions,
    option.fold(constNull, sessions =>
      pipe(
        sessions.length === 1,
        boolean.fold(
          () => (
            <MultipleSessionsMessagePanel sessionsCount={sessions.length} />
          ),
          () => <SingleSessionMessagePanel session={sessions[0]} />
        )
      )
    )
  )
}

interface MultipleSessionsMessagePanelProps {
  sessionsCount: number
}

function MultipleSessionsMessagePanel(
  props: MultipleSessionsMessagePanelProps
) {
  const { setRoute } = useRouter()

  return (
    <Panel
      color="warning"
      framed
      title={a18n`${props.sessionsCount} started sessions`}
      action={option.some({
        type: 'sync',
        icon: option.some(eye),
        label: a18n`Details`,
        action: () => setRoute(currentSessionsRoute())
      })}
    />
  )
}

interface SingleSessionMessagePanelProps {
  session: Session
}

function SingleSessionMessagePanel(props: SingleSessionMessagePanelProps) {
  const { setRoute } = useRouter()
  const { duration } = useSessionDurationClock(props.session)

  return (
    <Panel
      color="warning"
      framed
      title={a18n`One started session (${duration})`}
      action={option.some({
        type: 'sync',
        icon: option.some(eye),
        label: a18n`Details`,
        action: () =>
          setRoute(
            sessionRoute(
              props.session.project._id,
              props.session.task._id,
              props.session._id
            )
          )
      })}
    />
  )
}
