import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { a18n, formatDuration, formatMoneyAmount } from '../../a18n'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { List } from '../../components/List/List'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { useTaxes } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { Project } from '../../entities/Project'
import { computePercentage, formatPercentarge } from '../../globalDomain'
import { calculateNetValue, renderTaxItem } from '../Profile/utils'

interface Props {
  project: Project
}

export function ProjectProgress(props: Props) {
  const { taxes } = useTaxes()

  const progress = computePercentage(
    props.project.expectedWorkingHours,
    props.project.actualWorkingHours
  )

  return pipe(
    taxes,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error.message} />,
      taxes => (
        <Panel title={a18n`Progress`} framed action={option.none}>
          <List
            heading={option.some(a18n`Time`)}
            items={[
              {
                key: 'expectingWorkingHours',
                type: 'valued',
                label: option.none,
                content: a18n`Expected working hours`,
                description: option.none,
                value: formatDuration(
                  props.project.expectedWorkingHours * 3600000
                ),
                progress: option.none
              },
              {
                key: 'actualWorkingHours',
                type: 'valued',
                label: option.none,
                content: a18n`Actual working hours`,
                description: option.none,
                value: formatDuration(
                  props.project.actualWorkingHours * 3600000
                ),
                progress: option.none
              },
              {
                key: 'remainingTime',
                type: 'valued',
                label: option.none,
                content: a18n`Remaining time (hours)`,
                description: option.none,
                value: formatDuration(
                  (props.project.expectedWorkingHours -
                    props.project.actualWorkingHours) *
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
                value: formatMoneyAmount(props.project.budget),
                progress: option.none
              },
              ...taxes.map(tax =>
                renderTaxItem('budget', props.project.budget, tax)
              ),
              {
                key: 'netBudget',
                type: 'valued',
                label: option.none,
                content: a18n`Net budget`,
                description: option.none,
                value: formatMoneyAmount(
                  calculateNetValue(props.project.budget, taxes)
                ),
                progress: option.none
              },
              {
                key: 'grossBalance',
                type: 'valued',
                label: option.none,
                content: a18n`Gross balance`,
                description: option.none,
                value: formatMoneyAmount(props.project.balance),
                progress: option.none
              },
              ...taxes.map(tax =>
                renderTaxItem('balance', props.project.balance, tax)
              ),
              {
                key: 'netBalance',
                type: 'valued',
                label: option.none,
                content: a18n`Net balance`,
                description: option.none,
                value: formatMoneyAmount(
                  calculateNetValue(props.project.balance, taxes)
                ),
                progress: option.none
              }
            ]}
          />
        </Panel>
      )
    )
  )
}
