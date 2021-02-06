import { option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/lib/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { FC, useState } from 'react'
import { a18n, formatMoneyAmount } from '../../../a18n'
import { Tax } from '../../../entities/Tax'
import { LocalizedString, NonNegativeNumber } from '../../../globalDomain'
import { DateTimePicker } from '../../Form/Input/DateTimePicker/DateTimePicker'
import { List, ValuedItem } from '../../List/List'
import { Panel } from '../../Panel/Panel'
import { getNetValue } from '../utils'

interface Props {
  data: {
    since: Date
    cashedBalance: NonNegativeNumber
    taxes: Tax[]
  }
  onSinceDateChange: (since: Date) => TaskEither<LocalizedString, unknown>
}

export const CashedAmount: FC<Props> = props => {
  const [isSinceDateChanging, setIsSinceDateChanging] = useState(false)
  const [error, setError] = useState<Option<LocalizedString>>(option.none)

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
    <Panel title={a18n`Cashed amount`} framed action={option.none}>
      <p>{a18n`The amount of oney you cashed since a given date`}</p>

      <DateTimePicker
        name="since"
        mode="date"
        label={a18n`Since`}
        value={props.data.since}
        onChange={since => {
          setError(option.none)
          setIsSinceDateChanging(true)

          pipe(
            props.onSinceDateChange(since),
            taskEither.bimap(
              error => {
                setError(option.some(error))
                setIsSinceDateChanging(false)
              },
              () => setIsSinceDateChanging(false)
            )
          )()
        }}
        error={error}
        warning={option.none}
        disabled={isSinceDateChanging}
      />
      <List
        heading={option.none}
        items={[
          {
            key: 'grossCashedAmount',
            type: 'valued',
            label: option.none,
            content: a18n`Gross cashed amount`,
            description: option.none,
            value: formatMoneyAmount(props.data.cashedBalance),
            progress: option.none
          },
          ...props.data.taxes.map(tax =>
            renderTaxItem('cashedAmount', props.data.cashedBalance, tax)
          ),
          {
            key: 'netCashedAmount',
            type: 'valued',
            label: option.none,
            content: a18n`Net cashed amount`,
            description: option.none,
            value: formatMoneyAmount(
              getNetValue(props.data.cashedBalance, props.data.taxes)
            ),
            progress: option.none
          }
        ]}
      />
    </Panel>
  )
}
