import { option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { FC, useState } from 'react'
import { a18n, formatMoneyAmount, formatNumber } from '../../../a18n'
import { Tax } from '../../../entities/Tax'
import {
  computePercentage,
  formatPercentarge,
  LocalizedString,
  NonNegativeNumber
} from '../../../globalDomain'
import { DateTimePicker } from '../../Form/Input/DateTimePicker/DateTimePicker'
import { List, ValuedItem } from '../../List/List'
import { Panel } from '../../Panel/Panel'
import { getNetValue } from './utils'

interface Props {
  since: Date
  data: {
    expectedWorkingHours: NonNegativeNumber
    actualWorkingHours: NonNegativeNumber
    budget: NonNegativeNumber
    balance: NonNegativeNumber
    taxes: Tax[]
  }
  onSinceDateChange: (date: Date) => TaskEither<LocalizedString, unknown>
}

export const CurrentSituation: FC<Props> = props => {
  const [isSinceDateChanging, setIsDateSinceChanging] = useState(false)
  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  const progress = computePercentage(
    props.data.expectedWorkingHours,
    props.data.actualWorkingHours
  )

  const renderTaxItem = (
    commonKey: string,
    initialValue: number,
    tax: Tax
  ): ValuedItem => {
    const taxedFraction = -(initialValue * tax.value)

    return {
      key: `${commonKey}${tax.label}`,
      type: 'valued',
      label: option.none,
      content: tax.label,
      description: option.none,
      value: formatMoneyAmount(taxedFraction),
      progress: option.none,
      valueColor: 'danger',
      size: 'small'
    }
  }

  return (
    <Panel title={a18n`Current situation`} framed>
      <p>{a18n`Information about the amount of time you expect to work VS how much you already did, as well as the amount of money you will earn, since a given date`}</p>

      <DateTimePicker
        name="since"
        mode="date"
        label={a18n`Since`}
        value={props.since}
        onChange={since => {
          setError(option.none)
          setIsDateSinceChanging(true)

          pipe(
            props.onSinceDateChange(since),
            taskEither.bimap(
              error => {
                setError(option.some(error))
                setIsDateSinceChanging(false)
              },
              () => setIsDateSinceChanging(false)
            )
          )()
        }}
        error={error}
        warning={option.none}
        disabled={isSinceDateChanging}
      />
      <List
        heading={option.some(a18n`Time`)}
        items={[
          {
            key: 'expectingWorkingHours',
            type: 'valued',
            label: option.none,
            content: a18n`Expected working hours`,
            description: option.none,
            value: formatNumber(props.data.expectedWorkingHours),
            progress: option.none
          },
          {
            key: 'actualWorkingHours',
            type: 'valued',
            label: option.none,
            content: a18n`Actual working hours`,
            description: option.none,
            value: formatNumber(props.data.actualWorkingHours),
            progress: option.none
          },
          {
            key: 'remainingTime',
            type: 'valued',
            label: option.none,
            content: a18n`Remaining time (hours)`,
            description: option.none,
            value: formatNumber(
              props.data.expectedWorkingHours - props.data.actualWorkingHours
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
            value: formatMoneyAmount(props.data.budget),
            progress: option.none
          },
          ...props.data.taxes.map(tax =>
            renderTaxItem('budget', props.data.budget, tax)
          ),
          {
            key: 'netBudget',
            type: 'valued',
            label: option.none,
            content: a18n`Net budget`,
            description: option.none,
            value: formatMoneyAmount(
              getNetValue(props.data.budget, props.data.taxes)
            ),
            progress: option.none
          },
          {
            key: 'grossBalance',
            type: 'valued',
            label: option.none,
            content: a18n`Gross balance`,
            description: option.none,
            value: formatMoneyAmount(props.data.balance),
            progress: option.none
          },
          ...props.data.taxes.map(tax =>
            renderTaxItem('balance', props.data.balance, tax)
          ),
          {
            key: 'netBalance',
            type: 'valued',
            label: option.none,
            content: a18n`Net balance`,
            description: option.none,
            value: formatMoneyAmount(
              getNetValue(props.data.balance, props.data.taxes)
            ),
            progress: option.none
          }
        ]}
      />
    </Panel>
  )
}
