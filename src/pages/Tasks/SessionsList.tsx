import { array, boolean, option } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { Reader } from 'fp-ts/Reader'
import { useEffect, useState } from 'react'
import { a18n, formatDate, formatDuration, formatTime } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { useGet } from '../../effects/api/useApi'
import { SessionWithTaskLabel } from '../../entities/Session'
import { TaskWithStats } from '../../entities/Task'
import {
  LocalizedString,
  NonNegativeInteger,
  unsafeNonNegativeInteger,
  unsafePositiveInteger
} from '../../globalDomain'
import {
  ConnectionQueryInput,
  Edge,
  getConnectionNodes,
  unsafeCursor
} from '../../misc/Connection'
import { makeGetSessionsRequest } from './domain'
import { add } from 'ionicons/icons'
import { query } from '../../effects/api/api'
import { useCurrentSessions } from '../../contexts/CurrentSessionsContext'

interface Props {
  task: TaskWithStats
  onCreateSessionButtonClick: TaskEither<LocalizedString, unknown>
  onSessionListItemClick: Reader<SessionWithTaskLabel, unknown>
}

export function SessionsList(props: Props) {
  const { currentSessions } = useCurrentSessions()

  const [input] = useState<ConnectionQueryInput>({
    query: option.none,
    last: unsafePositiveInteger(10),
    before: option.none
  })

  const [sessions] = useGet(makeGetSessionsRequest(props.task._id), input)
  const [time, setTime] = useState<number>(Date.now())
  const { onSessionListItemClick } = props

  const allSessions = pipe(
    sessions,
    query.map(cursor =>
      pipe(
        currentSessions,
        option.map(
          flow(
            array.reduce<
              SessionWithTaskLabel,
              [NonNegativeInteger, Array<Edge<SessionWithTaskLabel>>]
            >(
              [cursor.pageInfo.totalCount, []],
              ([totalCount, extraSessions], currentSession) =>
                pipe(
                  cursor.edges,
                  array.findFirst(edge => currentSession._id === edge.node._id),
                  option.fold(
                    () => [
                      unsafeNonNegativeInteger(totalCount + 1),
                      // Since this is an ascendent Cursor, and we prepend the current sessions, we
                      // can fake the cursor here
                      [
                        {
                          cursor: unsafeCursor(currentSession._id),
                          node: currentSession
                        },
                        ...extraSessions
                      ]
                    ],
                    () => [totalCount, extraSessions]
                  )
                )
            ),
            ([totalCount, extraSessions]) => ({
              ...cursor,
              pageInfo: { ...cursor.pageInfo, totalCount },
              edges: [...extraSessions, ...cursor.edges]
            })
          )
        ),
        option.getOrElse(() => cursor)
      )
    )
  )

  const renderSessionItem: Reader<
    SessionWithTaskLabel,
    RoutedItem
  > = session => {
    const startDateString = formatDate(session.startTime)
    const startTimeString = formatTime(session.startTime)

    const endTime = pipe(
      session.endTime,
      option.map(endTime => endTime.getTime()),
      option.getOrElse(() => time)
    )

    const duration = formatDuration(endTime - session.startTime.getTime(), true)
    const durationString = a18n`${duration} hours`

    return {
      key: session._id,
      type: 'routed',
      label: option.none,
      content: pipe(
        session.endTime,
        option.fold(
          () =>
            a18n`${startDateString} at ${startTimeString} (${durationString})`,
          endTime => {
            const endDateString = formatDate(endTime)

            return pipe(
              startDateString === endDateString,
              boolean.fold(
                () =>
                  a18n`From ${startDateString} to ${startTimeString} to ${endDateString} (${durationString})`,
                () =>
                  a18n`From ${startDateString} at ${startTimeString} (${durationString})`
              )
            )
          }
        )
      ),
      description: option.none,
      action: () => onSessionListItemClick(session),
      details: true
    }
  }

  useEffect(() => {
    const interval = pipe(
      allSessions,
      query.fold(
        () => option.none,
        () => option.none,
        flow(
          getConnectionNodes,
          sessions => sessions.some(_ => option.isNone(_.endTime)),
          boolean.fold(
            () => option.none,
            () =>
              option.some(window.setInterval(() => setTime(Date.now()), 1000))
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
  }, [allSessions])

  return (
    <ConnectionList
      title={a18n`Sessions`}
      query={sessions}
      action={option.some({
        type: 'async',
        label: a18n`Start new session`,
        action: props.onCreateSessionButtonClick,
        icon: add
      })}
      onLoadMore={option.none}
      onSearchQueryChange={option.none}
      renderListItem={renderSessionItem}
      emptyListMessage={a18n`No sessions found`}
    />
  )
}
