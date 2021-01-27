import { option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
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
  const [isSinceChanging, setIsSinceChanging] = useState(false)

  const progress = computePercentage(
    props.data.expectedWorkingHours,
    props.data.actualWorkingHours
  )

  const cumulativeTaxes = props.data.taxes.reduce(
    (res, { value }) => res * (1 - value),
    1
  )
  const getNetValue = (grossValue: number): number =>
    grossValue * cumulativeTaxes

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
      <DateTimePicker
        name="since"
        mode="date"
        label={a18n`Since`}
        value={props.since}
        onChange={since => {
          setIsSinceChanging(true)

          pipe(
            props.onSinceDateChange(since),
            taskEither.chain(() =>
              taskEither.fromIO(() => setIsSinceChanging(false))
            )
          )()
        }}
        error={option.none}
        warning={option.none}
        disabled={isSinceChanging}
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
            content: a18n`Budget (gross)`,
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
            content: a18n`Budget (net)`,
            description: option.none,
            value: formatMoneyAmount(getNetValue(props.data.budget)),
            progress: option.none
          },
          {
            key: 'grossBalance',
            type: 'valued',
            label: option.none,
            content: a18n`Balance (gross)`,
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
            content: a18n`Balance (net)`,
            description: option.none,
            value: formatMoneyAmount(getNetValue(props.data.balance)),
            progress: option.none
          }
        ]}
      />
    </Panel>
  )
}
