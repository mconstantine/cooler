import { option } from 'fp-ts'
import { FC } from 'react'
import { a18n, formatDuration, formatMoneyAmount } from '../../../a18n'
import { Tax } from '../../../entities/Tax'
import {
  computePercentage,
  formatPercentarge,
  NonNegativeNumber
} from '../../../globalDomain'
import { Body } from '../../Body/Body'
import { List, ValuedItem } from '../../List/List'
import { Panel } from '../../Panel/Panel'
import { getNetValue } from '../utils'

interface Props {
  data: {
    expectedWorkingHours: NonNegativeNumber
    actualWorkingHours: NonNegativeNumber
    budget: NonNegativeNumber
    balance: NonNegativeNumber
  }
  taxes: Tax[]
}

export const ProjectProgress: FC<Props> = props => {
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
    <Panel title={a18n`Overall progress`} framed action={option.none}>
      <Body>
        {a18n`Information about the amount of time you expect to work VS how much you already did, as well as the amount of money you will earn for this project`}
      </Body>

      <List
        heading={option.some(a18n`Time`)}
        items={[
          {
            key: 'expectedWorkingHours',
            type: 'valued',
            progress: option.none,
            label: option.none,
            description: option.none,
            content: a18n`Expected working hours`,
            value: formatDuration(props.data.expectedWorkingHours * 3600000)
          },
          {
            key: 'actualWorkingHours',
            type: 'valued',
            progress: option.none,
            label: option.none,
            description: option.none,
            content: a18n`Actual working hours`,
            value: formatDuration(props.data.actualWorkingHours * 3600000)
          },
          {
            key: 'remainingTime',
            type: 'valued',
            progress: option.none,
            label: option.none,
            description: option.none,
            content: a18n`Remaining time (hours)`,
            value: formatDuration(
              (props.data.expectedWorkingHours -
                props.data.actualWorkingHours) *
                3600000
            )
          },
          {
            key: 'progress',
            type: 'valued',
            progress: option.some(progress),
            label: option.none,
            description: option.none,
            content: a18n`Progress`,
            value: formatPercentarge(progress)
          }
        ]}
      />

      <List
        heading={option.some(a18n`Money`)}
        items={[
          {
            key: 'grossBudget',
            type: 'valued',
            progress: option.none,
            label: option.none,
            description: option.none,
            content: a18n`Gross budget`,
            value: formatMoneyAmount(props.data.budget)
          },
          ...props.taxes.map(tax =>
            renderTaxItem('grossBudget', props.data.budget, tax)
          ),
          {
            key: 'netBudget',
            type: 'valued',
            progress: option.none,
            label: option.none,
            description: option.none,
            content: a18n`Net budget`,
            value: formatMoneyAmount(
              getNetValue(props.data.budget, props.taxes)
            )
          },
          {
            key: 'grossBalance',
            type: 'valued',
            progress: option.none,
            label: option.none,
            description: option.none,
            content: a18n`Gross balance`,
            value: formatMoneyAmount(props.data.balance)
          },
          ...props.taxes.map(tax =>
            renderTaxItem('grossBalance', props.data.budget, tax)
          ),
          {
            key: 'netBalance',
            type: 'valued',
            progress: option.none,
            label: option.none,
            description: option.none,
            content: a18n`Net balance`,
            value: formatMoneyAmount(
              getNetValue(props.data.balance, props.taxes)
            )
          }
        ]}
      />
    </Panel>
  )
}
