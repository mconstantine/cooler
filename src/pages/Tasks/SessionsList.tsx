import { array, boolean, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { Reader } from 'fp-ts/Reader'
import { useEffect, useState } from 'react'
import { a18n, formatDate, formatDuration, formatTime } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { useReactiveCommand } from '../../effects/api/useApi'
import { SessionWithTaskLabel } from '../../entities/Session'
import { TaskWithStats } from '../../entities/Task'
import {
  LocalizedString,
  unsafeNonNegativeInteger,
  unsafePositiveInteger
} from '../../globalDomain'
import { ConnectionQueryInput, Edge, unsafeCursor } from '../../misc/Connection'
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

  const [sessions, setSessions, fetchSessionsCommand] = useReactiveCommand(
    makeGetSessionsRequest(props.task._id)
  )

  const { onSessionListItemClick } = props

  const renderSessionItem: Reader<
    SessionWithTaskLabel,
    RoutedItem
  > = session => {
    const startDateString = formatDate(session.startTime)
    const startTimeString = formatTime(session.startTime)

    const endTime = pipe(
      session.endTime,
      option.map(endTime => endTime.getTime()),
      option.getOrElse(() => Date.now())
    )

    const duration = formatDuration(endTime - session.startTime.getTime())
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
    const fetchSessions = fetchSessionsCommand(input)
    fetchSessions()
  }, [input, fetchSessionsCommand])

  useEffect(() => {
    pipe(
      sessions,
      query.fold(constVoid, constVoid, cursor =>
        pipe(
          currentSessions,
          option.fold(constVoid, currentSessions => {
            const [allSessionsCount, extraSessions]: [
              count: number,
              sessions: Array<Edge<SessionWithTaskLabel>>
            ] = currentSessions.reduce(
              ([allSessionsCount, extraSessions], currentSession) =>
                pipe(
                  cursor.edges,
                  array.findFirst(edge => currentSession._id === edge.node._id),
                  option.fold(
                    () => [
                      allSessionsCount + 1,
                      // Since this is an ascendent Cursor, and we prepend the current sessions, we can
                      // fake the cursor here
                      [
                        {
                          cursor: unsafeCursor(currentSession._id),
                          node: currentSession
                        },
                        ...extraSessions
                      ]
                    ],
                    () => [allSessionsCount, extraSessions]
                  )
                ),
              [cursor.pageInfo.totalCount, []] as [
                count: number,
                sessions: Array<Edge<SessionWithTaskLabel>>
              ]
            )

            setSessions({
              ...cursor,
              pageInfo: {
                ...cursor.pageInfo,
                // This comes from a non-negative count that either stays the same or is incremented by
                // 1, so it's ok to be unsafe
                totalCount: unsafeNonNegativeInteger(allSessionsCount)
              },
              edges: [...extraSessions, ...cursor.edges]
            })
          })
        )
      )
    )
    // We don't need to react to changes in sessions, we also call setSessions so we would go in a loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessions])

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
