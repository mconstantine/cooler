import { option, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { Option } from 'fp-ts/Option'
import { FC, useEffect, useRef, useState } from 'react'
import {
  a18n,
  formatDuration,
  formatMoneyAmount,
  formatNumber
} from '../../../a18n'
import {
  computePercentage,
  formatPercentarge,
  LocalizedString,
  NonNegativeNumber
} from '../../../globalDomain'
import { List } from '../../List/List'
import { Panel } from '../../Panel/Panel'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { Session } from '../../../entities/Session'
import { play, stop } from 'ionicons/icons'

type Mode = 'standalone' | 'inTaskPage'

function foldMode<T>(
  whenStandalone: () => T,
  whenInTaskPage: () => T
): (mode: Mode) => T {
  return mode => {
    switch (mode) {
      case 'standalone':
        return whenStandalone()
      case 'inTaskPage':
        return whenInTaskPage()
    }
  }
}

interface Props {
  mode: Mode
  data: {
    name: LocalizedString
    expectedWorkingHours: NonNegativeNumber
    actualWorkingHours: NonNegativeNumber
    hourlyCost: NonNegativeNumber
  }
  currentSession: Option<Session>
  startSession: TaskEither<LocalizedString, Session>
  stopSession: ReaderTaskEither<Session, LocalizedString, unknown>
}

function computeTime(
  previousWorkingHours: NonNegativeNumber,
  currentSession: Option<Session>
): number {
  return (
    previousWorkingHours * 3600000 +
    pipe(
      currentSession,
      option.fold(
        () => 0,
        session => Date.now() - session.start_time.getTime()
      )
    )
  )
}

export const TaskProgress: FC<Props> = props => {
  const [session, setSession] = useState(props.currentSession)
  const interval = useRef<Option<number>>(option.none)

  const [time, setTime] = useState(
    computeTime(props.data.actualWorkingHours, session)
  )

  const progress = computePercentage(
    props.data.expectedWorkingHours * 3600000,
    time
  )

  useEffect(() => {
    pipe(
      session,
      option.fold(
        () =>
          pipe(
            interval.current,
            option.fold(constVoid, i => {
              window.clearInterval(i)
              interval.current = option.none
            })
          ),
        session => {
          interval.current = option.some(
            window.setInterval(() => {
              setTime(
                computeTime(props.data.actualWorkingHours, option.some(session))
              )
            }, 1000)
          )
        }
      )
    )

    return () => {
      pipe(
        interval.current,
        option.fold(constVoid, i => {
          window.clearInterval(i)
          interval.current = option.none
        })
      )
    }
  }, [session, props.data.actualWorkingHours])

  return (
    <Panel
      title={pipe(
        props.mode,
        foldMode(
          () => props.data.name,
          () => a18n`Progress`
        )
      )}
      action={pipe(
        session,
        option.fold(
          () =>
            option.some({
              type: 'async',
              label: a18n`Start session`,
              icon: play,
              action: pipe(
                props.startSession,
                taskEither.chain(session =>
                  taskEither.fromIO(() => setSession(option.some(session)))
                )
              )
            }),
          session =>
            option.some({
              type: 'async',
              label: a18n`Stop session`,
              icon: stop,
              action: pipe(
                props.stopSession(session),
                taskEither.chain(() =>
                  taskEither.fromIO(() => setSession(option.none))
                )
              )
            })
        )
      )}
      framed
    >
      <List
        heading={option.none}
        items={[
          {
            key: 'expectedWorkingHours',
            type: 'valued',
            label: option.none,
            content: a18n`Expected working hours`,
            description: option.none,
            value: formatNumber(props.data.expectedWorkingHours),
            progress: option.none
          },
          {
            key: 'workingTime',
            type: 'valued',
            label: option.none,
            content: a18n`Working time`,
            description: option.none,
            value: formatDuration(time, true),
            progress: option.none
          },
          {
            key: 'balance',
            type: 'valued',
            label: option.none,
            content: a18n`Current balance`,
            description: option.none,
            value: formatMoneyAmount((time / 3600000) * props.data.hourlyCost),
            progress: option.none
          },
          {
            key: 'progress',
            type: 'valued',
            label: option.none,
            content: a18n`Progress`,
            description: option.none,
            value: formatPercentarge(progress),
            progress: option.some(progress),
            valueColor: pipe(
              session,
              option.fold(
                () => 'default',
                () => 'primary'
              )
            )
          }
        ]}
      />
    </Panel>
  )
}
