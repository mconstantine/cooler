import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { useState } from 'react'
import {
  a18n,
  formatDuration,
  formatMoneyAmount,
  unsafeLocalizedString
} from '../../a18n'
import { Body } from '../../components/Body/Body'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { DateTimePicker } from '../../components/Form/Input/DateTimePicker/DateTimePicker'
import { List } from '../../components/List/List'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { useTaxes } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { useGet } from '../../effects/api/useApi'
import { computePercentage, formatPercentarge } from '../../globalDomain'
import { getProfileStatsRequest, ProfileStatsQueryInput } from './domain'
import { calculateNetValue, renderTaxItem } from './utils'

export function ProfileStats() {
  const { taxes } = useTaxes()
  const [input, setInput] = useState<ProfileStatsQueryInput>({
    since: new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
      0,
      0,
      0,
      0
    )
  })

  const [profileStats] = useGet(getProfileStatsRequest, input)

  return pipe(
    taxes,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      taxes => (
        <Panel title={a18n`Current situation`} framed action={option.none}>
          <Body>
            {a18n`Information about the amount of time you expect to work VS how much you already did, as well as the amount of money you will earn, since a given date`}
          </Body>
          <DateTimePicker
            name="currentSituationSince"
            mode="date"
            label={a18n`Since`}
            value={input.since}
            onChange={since => setInput({ since })}
            error={option.none}
            warning={option.none}
            disabled={query.isLoading(profileStats)}
          />
          {pipe(
            profileStats,
            query.fold(
              () => <LoadingBlock />,
              error => <ErrorPanel error={error} />,
              stats => {
                const progress = computePercentage(
                  stats.expectedWorkingHours,
                  stats.actualWorkingHours
                )

                return (
                  <>
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
                            stats.expectedWorkingHours * 3600000
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
                            stats.actualWorkingHours * 3600000
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
                            (stats.expectedWorkingHours -
                              stats.actualWorkingHours) *
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
                          value: formatMoneyAmount(stats.budget),
                          progress: option.none
                        },
                        ...taxes.map(tax =>
                          renderTaxItem('budget', stats.budget, tax)
                        ),
                        {
                          key: 'netBudget',
                          type: 'valued',
                          label: option.none,
                          content: a18n`Net budget`,
                          description: option.none,
                          value: formatMoneyAmount(
                            calculateNetValue(stats.budget, taxes)
                          ),
                          progress: option.none
                        },
                        {
                          key: 'grossBalance',
                          type: 'valued',
                          label: option.none,
                          content: a18n`Gross balance`,
                          description: option.none,
                          value: formatMoneyAmount(stats.balance),
                          progress: option.none
                        },
                        ...taxes.map(tax =>
                          renderTaxItem('balance', stats.balance, tax)
                        ),
                        {
                          key: 'netBalance',
                          type: 'valued',
                          label: option.none,
                          content: a18n`Net balance`,
                          description: option.none,
                          value: formatMoneyAmount(
                            calculateNetValue(stats.balance, taxes)
                          ),
                          progress: option.none
                        }
                      ]}
                    />
                  </>
                )
              }
            )
          )}
        </Panel>
      )
    )
  )
}
