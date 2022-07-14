import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { a18n, formatDuration, formatMoneyAmount } from '../../a18n'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { List } from '../../components/List/List'
import { Loading } from '../../components/Loading/Loading'
import { Panel } from '../../components/Panel/Panel'
import { useTaxes } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { TaskWithStats } from '../../entities/Task'
import { computePercentage, formatPercentarge } from '../../globalDomain'
import { calculateNetValue, renderTaxItem } from '../Profile/utils'

interface Props {
  task: TaskWithStats
}

export function TaskProgress(props: Props) {
  const { taxes } = useTaxes()

  const progress = computePercentage(
    props.task.expectedWorkingHours,
    props.task.actualWorkingHours
  )

  const budget = props.task.expectedWorkingHours * props.task.hourlyCost
  const balance = props.task.actualWorkingHours * props.task.hourlyCost

  return pipe(
    taxes,
    query.fold(
      () => <Loading />,
      error => <ErrorPanel error={error} />,
      taxes => (
        <Panel title={a18n`Progress`} framed action={option.none}>
          <List
            heading={option.some(a18n`Time`)}
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
                value: formatDuration(props.task.actualWorkingHours * 3600000),
                progress: option.none
              },
              {
                key: 'remainingTime',
                type: 'valued',
                label: option.none,
                content: a18n`Remaining time (hours)`,
                description: option.none,
                value: formatDuration(
                  (props.task.expectedWorkingHours -
                    props.task.actualWorkingHours) *
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
