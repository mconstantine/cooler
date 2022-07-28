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
import { ProjectWithStats } from '../../entities/Project'
import { SessionWithTaskLabel } from '../../entities/Session'
import { computePercentage, formatPercentarge } from '../../globalDomain'
import { calculateNetValue, renderTaxItem } from '../Profile/utils'

interface Props {
  project: ProjectWithStats
}

export function ProjectProgress(props: Props) {
  const { taxes } = useTaxes()
  const { currentSessions } = useCurrentSessions()

  const currentSessionsWithDuration = useSessionsClock(
    pipe(
      currentSessions,
      option.map(sessions =>
        sessions.filter(session => session.task.project === props.project._id)
      ),
      option.getOrElse(() => [] as SessionWithTaskLabel[])
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
    props.project.actualWorkingHours + currentSessionsWorkingHours

  const progress = computePercentage(
    props.project.expectedWorkingHours,
    actualWorkingHours
  )

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
                  (props.project.expectedWorkingHours - actualWorkingHours) *
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
