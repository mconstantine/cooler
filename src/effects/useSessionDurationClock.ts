import { nonEmptyArray, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { Option } from 'fp-ts/Option'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDuration } from '../a18n'
import { formatSessionDuration } from '../entities/Session'
import { LocalizedString } from '../globalDomain'

interface Session {
  startTime: Date
  endTime: Option<Date>
}

type SessionWithDuration<T> = T & {
  duration: LocalizedString
}

interface SessionDurationClock {
  duration: LocalizedString
  start: IO<void>
  stop: IO<void>
}

export function useSessionDurationClock(
  session: Session,
  shouldStartAutomatically = true
): SessionDurationClock {
  const intervalRef = useRef<Option<number>>(option.none)

  const [duration, setDuration] = useState<LocalizedString>(
    formatSessionDuration(session)
  )

  const start: IO<void> = () => {
    stop()
    intervalRef.current = option.some(
      window.setInterval(
        () =>
          setDuration(
            formatDuration(Date.now() - session.startTime.getTime(), true)
          ),
        1000
      )
    )
  }

  const stop: IO<void> = () => {
    pipe(
      intervalRef.current,
      option.fold(constVoid, interval => {
        window.clearInterval(interval)
        intervalRef.current = option.none
      })
    )
  }

  useEffect(() => {
    shouldStartAutomatically && start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { duration, start, stop }
}

export function useSessionsListClock<T extends Session>(
  sessions: NonEmptyArray<T>
): NonEmptyArray<SessionWithDuration<T>> {
  const [time, setTime] = useState<number>(Date.now())

  const sessionsWithDuration = useMemo<NonEmptyArray<SessionWithDuration<T>>>(
    () =>
      pipe(
        sessions,
        nonEmptyArray.map(session => {
          const endTime = pipe(
            session.endTime,
            option.map(endTime => endTime.getTime()),
            option.getOrElse(() => time)
          )

          return {
            ...session,
            duration: formatDuration(
              endTime - session.startTime.getTime(),
              true
            )
          }
        })
      ),
    [sessions, time]
  )

  useEffect(() => {
    const interval = window.setInterval(() => setTime(Date.now()), 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  return sessionsWithDuration
}
