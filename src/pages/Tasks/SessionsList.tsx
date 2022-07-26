import { boolean, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { Reader } from 'fp-ts/Reader'
import { useState } from 'react'
import { a18n, formatDate, formatTime } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { useGet } from '../../effects/api/useApi'
import {
  formatSessionDuration,
  SessionWithTaskLabel
} from '../../entities/Session'
import { TaskWithStats } from '../../entities/Task'
import { LocalizedString, unsafePositiveInteger } from '../../globalDomain'
import { ConnectionQueryInput } from '../../misc/Connection'
import { makeGetSessionsRequest } from './domain'
import { add } from 'ionicons/icons'

interface Props {
  task: TaskWithStats
  onCreateSessionButtonClick: TaskEither<LocalizedString, unknown>
  onSessionListItemClick: Reader<SessionWithTaskLabel, unknown>
}

export function SessionsList(props: Props) {
  const [input] = useState<ConnectionQueryInput>({
    query: option.none,
    last: unsafePositiveInteger(10),
    before: option.none
  })

  const [sessions] = useGet(makeGetSessionsRequest(props.task._id), input)

  const renderSessionItem: Reader<
    SessionWithTaskLabel,
    RoutedItem
  > = session => {
    const startDateString = formatDate(session.startTime)
    const startTimeString = formatTime(session.startTime)
    const duration = formatSessionDuration(session)
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
      action: () => props.onSessionListItemClick(session),
      details: true
    }
  }

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
