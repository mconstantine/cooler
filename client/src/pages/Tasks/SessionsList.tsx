import { array, boolean, nonEmptyArray, option, taskEither } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { Reader } from 'fp-ts/Reader'
import { useEffect, useState } from 'react'
import { a18n, formatDate, formatDuration, formatTime } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { useGet, usePost } from '../../effects/api/useApi'
import { Session } from '../../entities/Session'
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
import { makeGetSessionsRequest, startSessionRequest } from './domain'
import { add, play } from 'ionicons/icons'
import { query } from '../../effects/api/api'
import { useCurrentSessions } from '../../contexts/CurrentSessionsContext'
import { sessionRoute, useRouter } from '../../components/Router'
import { HeadingAction } from '../../components/Heading/Heading'
import { Modal } from '../../components/Modal/Modal'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import {
  AddWorkingHoursForm,
  FormData
} from '../../components/Form/Forms/AddWorkingHoursForm'

interface Props {
  task: TaskWithStats
  onCreateSessionButtonClick: TaskEither<LocalizedString, unknown>
  onWorkingHoursAdded: Reader<Session, unknown>
}

export function SessionsList(props: Props) {
  const { setRoute } = useRouter()
  const { currentSessions } = useCurrentSessions()

  const [input] = useState<ConnectionQueryInput>({
    query: option.none,
    last: unsafePositiveInteger(10),
    before: option.none
  })

  const [sessions, reload] = useGet(
    makeGetSessionsRequest(props.task._id),
    input
  )
  const [time, setTime] = useState<number>(Date.now())
  const [isAddingWorkingHours, setIsAddingWorkingHours] = useState(false)
  const createSession = usePost(startSessionRequest)

  const allSessions = pipe(
    sessions,
    query.map(cursor =>
      pipe(
        currentSessions,
        option.map(
          flow(
            array.reduce<Session, [NonNegativeInteger, Array<Edge<Session>>]>(
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

  const onSessionListItemClick = (
    session: Session,
    shouldOpenInNewTab: boolean
  ) =>
    setRoute(
      sessionRoute(props.task.project._id, props.task._id, session._id),
      shouldOpenInNewTab
    )

  const renderSessionItem: Reader<Session, RoutedItem> = session => {
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
      action: _ => onSessionListItemClick(session, _),
      details: true
    }
  }

  const onAddWorkingHoursFormSubmit: ReaderTaskEither<
    FormData,
    LocalizedString,
    void
  > = data =>
    pipe(
      createSession({
        task: props.task._id,
        startTime: data.startTime,
        endTime: option.some(
          new Date(data.startTime.getTime() + data.hoursCount * 3600000)
        )
      }),
      taskEither.chain(session =>
        taskEither.fromIO(() => {
          props.onWorkingHoursAdded(session)
          setIsAddingWorkingHours(false)
          reload()
        })
      )
    )

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
    <>
      <ConnectionList
        title={a18n`Sessions`}
        query={allSessions}
        actions={option.some(
          pipe(
            nonEmptyArray.of<HeadingAction>({
              type: 'async',
              label: option.some(a18n`Start new session`),
              action: () => props.onCreateSessionButtonClick,
              icon: play
            }),
            nonEmptyArray.concat(
              nonEmptyArray.of<HeadingAction>({
                type: 'sync',
                label: a18n`Add working hours`,
                action: () => setIsAddingWorkingHours(true),
                icon: option.some(add)
              })
            )
          )
        )}
        onLoadMore={option.none}
        onSearchQueryChange={option.none}
        renderListItem={renderSessionItem}
        emptyListMessage={a18n`No sessions found`}
      />
      <Modal
        isOpen={isAddingWorkingHours}
        onClose={() => setIsAddingWorkingHours(false)}
      >
        <AddWorkingHoursForm
          startTime={props.task.startTime}
          onSubmit={onAddWorkingHoursFormSubmit}
          onCancel={() => setIsAddingWorkingHours(false)}
        />
      </Modal>
    </>
  )
}
