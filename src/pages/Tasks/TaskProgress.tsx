import { array, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import {
  a18n,
  formatDuration,
  formatMoneyAmount,
  unsafeLocalizedString
} from '../../a18n'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { List } from '../../components/List/List'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { useCurrentSessions } from '../../contexts/CurrentSessionsContext'
import { useTaxes } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { useSessionsClock } from '../../effects/useSessionDurationClock'
import { Session } from '../../entities/Session'
import { TaskWithStats } from '../../entities/Task'
import { computePercentage, formatPercentarge } from '../../globalDomain'
import { calculateNetValue, renderTaxItem } from '../Profile/utils'

interface Props {
  task: TaskWithStats
}

export function TaskProgress(props: Props) {
  const { taxes } = useTaxes()
  const { currentSessions } = useCurrentSessions()

  const currentSessionsWithDuration = useSessionsClock(
    pipe(
      currentSessions,
      option.map(sessions =>
        sessions.filter(session => session.task._id === props.task._id)
      ),
      option.getOrElse(() => [] as Session[])
    )
  )

  const currentSessionsWorkingHours = pipe(
    currentSessionsWithDuration,
    array.reduce(
      0,
      (workingHours, session) => workingHours + session.duration / 3600000
    )
  )

  const actualWorkingHours =
    props.task.actualWorkingHours + currentSessionsWorkingHours

  const progress = computePercentage(
    props.task.expectedWorkingHours,
    actualWorkingHours
  )

  const budget = props.task.expectedWorkingHours * props.task.hourlyCost
  const balance = actualWorkingHours * props.task.hourlyCost

  return pipe(
    taxes,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      taxes => (
        <Panel title={a18n`Progress`} framed action={option.none}>
          <List
            heading={option.some(a18n`Time`)}
            emptyListMessage={unsafeLocalizedString('')}
            items={[
              {
                key: 'expectedWorkingHours',
                type: 'valued',
                label: option.none,
                content: a18n`Expected working hours`,
                description: option.none,
                value: formatDuration(
                  props.task.expectedWorkingHours * 3600000
                ),
                progress: option.none
              },
              {
                key: 'actualWorkingHours',
                type: 'valued',
                label: option.none,
                content: a18n`Actual working hours`,
                description: option.none,
                value: formatDuration(actualWorkingHours * 3600000),
                progress: option.none
              },
              {
                key: 'remainingTime',
                type: 'valued',
                label: option.none,
                content: a18n`Remaining time (hours)`,
                description: option.none,
                value: formatDuration(
                  (props.task.expectedWorkingHours - actualWorkingHours) *
                    3600000
                ),
                progress: option.none
              },
              {
                key: 'progress',
                type: 'valued',
                label: option.none,
                content: a18n`Progress`,
                description: option.none,
                value: formatPercentarge(progress),
                progress: option.some(progress)
              }
            ]}
          />
          <List
            heading={option.some(a18n`Money`)}
            emptyListMessage={unsafeLocalizedString('')}
            items={[
              {
                key: 'grossBudget',
                type: 'valued',
                label: option.none,
                content: a18n`Gross budget`,
                description: option.none,
                value: formatMoneyAmount(budget),
                progress: option.none
              },
              ...taxes.map(tax => renderTaxItem('budget', budget, tax)),
              {
                key: 'netBudget',
                type: 'valued',
                label: option.none,
                content: a18n`Net budget`,
                description: option.none,
                value: formatMoneyAmount(calculateNetValue(budget, taxes)),
                progress: option.none
              },
              {
                key: 'grossBalance',
                type: 'valued',
                label: option.none,
                content: a18n`Gross balance`,
                description: option.none,
                value: formatMoneyAmount(balance),
                progress: option.none
              },
              ...taxes.map(tax => renderTaxItem('balance', balance, tax)),
              {
                key: 'netBalance',
                type: 'valued',
                label: option.none,
                content: a18n`Net balance`,
                description: option.none,
                value: formatMoneyAmount(calculateNetValue(balance, taxes)),
                progress: option.none
              }
            ]}
          />
        </Panel>
      )
    )
  )
}
