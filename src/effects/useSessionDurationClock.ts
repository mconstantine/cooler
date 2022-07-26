import { nonEmptyArray, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { Option } from 'fp-ts/Option'
import { useEffect, useMemo, useState } from 'react'
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

export function useSessionDurationClock(session: Session): LocalizedString {
  const [duration, setDuration] = useState<LocalizedString>(
    formatSessionDuration(session)
  )

  useEffect(() => {
    const interval = pipe(
      session.endTime,
      option.fold(
        () =>
          option.some(
            window.setInterval(
              () =>
                setDuration(
                  formatDuration(Date.now() - session.startTime.getTime(), true)
                ),
              1000
            )
          ),
        () => option.none
      )
    )

    return () => {
      pipe(
        interval,
        option.map(interval => window.clearInterval(interval))
      )
    }
  }, [session])

  return duration
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
